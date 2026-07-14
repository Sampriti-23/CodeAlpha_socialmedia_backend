const Follow = require("../models/Follow");
const User = require("../models/User");
const Notification = require("../models/Notification"); // 🟢 ADD THIS IMPORT

// ============================
// FOLLOW USER
// ============================
exports.followUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { followingId } = req.body;

    // PREVENT SELF FOLLOW
    if (followerId.toString() === followingId) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    }

    // CHECK USER EXISTS
    const userToFollow = await User.findById(followingId);
    if (!userToFollow) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // CHECK ALREADY FOLLOWING
    const existingFollow = await Follow.findOne({ follower: followerId, following: followingId });
    if (existingFollow) {
      return res.status(400).json({ success: false, message: "Already following this user" });
    }

    // CREATE FOLLOW
    const follow = await Follow.create({ follower: followerId, following: followingId });

    // UPDATE USERS
    await User.findByIdAndUpdate(followerId, { $addToSet: { following: followingId } });
    await User.findByIdAndUpdate(followingId, { $addToSet: { followers: followerId } });

    // ==========================================
    // 🟢 LIVE NOTIFICATION LOGIC 
    // ==========================================
    const currentUser = await User.findById(followerId); // Get sender's details
    
    let newNotif = await Notification.create({
      receiver: followingId,
      sender: followerId,
      type: "follow",
      message: `${currentUser.username} started following you.`
    });

    // Populate sender details so the frontend gets the profile picture instantly
    newNotif = await newNotif.populate("sender", "username profilePicture");

    const io = req.app.get("socketio");
    if (io) {
      io.emit("getNotification", newNotif); // Broadcast to socket
    }
    // ==========================================

    res.status(201).json({
      success: true,
      message: "User followed successfully",
      data: follow,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error while following user", error: error.message });
  }
};

// ============================
// UNFOLLOW USER
// ============================

exports.unfollowUser = async (
  req,
  res
) => {

  try {

    const followerId =
      req.user._id;

    const { followingId } =
      req.body;

    // =========================
    // DELETE FOLLOW
    // =========================

    const follow =
      await Follow.findOneAndDelete({

        follower: followerId,

        following: followingId,
      });

    if (!follow) {

      return res.status(404).json({

        success: false,

        message:
          "Follow relationship not found",
      });
    }

    // =========================
    // REMOVE FOLLOWING
    // =========================

    await User.findByIdAndUpdate(

      followerId,

      {
        $pull: {

          following:
            followingId,
        },
      }
    );

    // =========================
    // REMOVE FOLLOWERS
    // =========================

    await User.findByIdAndUpdate(

      followingId,

      {
        $pull: {

          followers:
            followerId,
        },
      }
    );

    res.status(200).json({

      success: true,

      message:
        "User unfollowed successfully",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Error while unfollowing user",

      error: error.message,
    });
  }
};

// ============================
// GET FOLLOWERS OF A USER
// ============================

exports.getFollowers = async (
  req,
  res
) => {

  try {

    const { userId } =
      req.params;

    const followers =
      await Follow.find({

        following: userId,
      })

      .populate(

        "follower",

        "username email profilePicture"
      );

    res.status(200).json({

      success: true,

      totalFollowers:
        followers.length,

      data: followers,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Error fetching followers",

      error: error.message,
    });
  }
};

// ============================
// GET FOLLOWING LIST
// ============================

exports.getFollowing = async (
  req,
  res
) => {

  try {

    const { userId } =
      req.params;

    const following =
      await Follow.find({

        follower: userId,
      })

      .populate(

        "following",

        "username email profilePicture"
      );

    res.status(200).json({

      success: true,

      totalFollowing:
        following.length,

      data: following,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Error fetching following list",

      error: error.message,
    });
  }
};

// ============================
// CHECK FOLLOW STATUS
// ============================

exports.checkFollowStatus =
async (req, res) => {

  try {

    const followerId =
      req.user._id;

    const { userId } =
      req.params;

    const follow =
      await Follow.findOne({

        follower: followerId,

        following: userId,
      });

    res.status(200).json({

      success: true,

      isFollowing:
        follow ? 1 : 0,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Error checking follow status",

      error: error.message,
    });
  }
};

