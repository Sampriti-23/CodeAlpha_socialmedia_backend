const Follow = require("../models/Follow");
const User = require("../models/User");

// ============================
// FOLLOW USER
// ============================
exports.followUser = async (req, res) => {
  try {
    const followerId = req.user._id; // Logged in user
    const { followingId } = req.body;

    // Prevent self follow
    if (followerId.toString() === followingId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    // Check if user exists
    const userToFollow = await User.findById(followingId);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: "Already following this user",
      });
    }

    // Create follow
    const follow = await Follow.create({
      follower: followerId,
      following: followingId,
    });

    res.status(201).json({
      success: true,
      message: "User followed successfully",
      data: follow,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error while following user",
      error: error.message,
    });
  }
};

// ============================
// UNFOLLOW USER
// ============================
exports.unfollowUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { followingId } = req.body;

    const follow = await Follow.findOneAndDelete({
      follower: followerId,
      following: followingId,
    });

    if (!follow) {
      return res.status(404).json({
        success: false,
        message: "Follow relationship not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error while unfollowing user",
      error: error.message,
    });
  }
};

// ============================
// GET FOLLOWERS OF A USER
// ============================
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const followers = await Follow.find({
      following: userId,
    }).populate("follower", "name email profilePic");

    res.status(200).json({
      success: true,
      totalFollowers: followers.length,
      data: followers,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error fetching followers",
      error: error.message,
    });
  }
};

// ============================
// GET FOLLOWING LIST
// ============================
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const following = await Follow.find({
      follower: userId,
    }).populate("following", "name email profilePic");

    res.status(200).json({
      success: true,
      totalFollowing: following.length,
      data: following,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error fetching following list",
      error: error.message,
    });
  }
};

// ============================
// CHECK FOLLOW STATUS
// ============================
exports.checkFollowStatus = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { followingId } = req.params;

    const follow = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });

    res.status(200).json({
      success: true,
      isFollowing: !!follow,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error checking follow status",
      error: error.message,
    });
  }
};