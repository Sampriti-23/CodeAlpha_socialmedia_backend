const Follow = require('../models/Follow');

// ✅ Follow a user
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.body; // user to follow
    const followerId = req.user.id; // logged-in user (from auth middleware)

    if (followerId === userId) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const follow = await Follow.create({
      follower: followerId,
      following: userId
    });

    res.status(201).json({
      success: true,
      message: "User followed successfully",
      follow
    });

  } catch (error) {
    // Handle duplicate follow (unique index error)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Already following this user"
      });
    }

    res.status(500).json({ message: error.message });
  }
};

// ❌ Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    const result = await Follow.findOneAndDelete({
      follower: followerId,
      following: userId
    });

    if (!result) {
      return res.status(404).json({
        message: "Follow request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User unfollowed successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📥 Get followers of a user
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const followers = await Follow.find({ following: userId })
      .populate('follower', 'name email');

    res.status(200).json({
      count: followers.length,
      followers
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📤 Get users that a user is following
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const following = await Follow.find({ follower: userId })
      .populate('following', 'name email');

    res.status(200).json({
      count: following.length,
      following
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Check if current user follows another user
exports.checkFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    const exists = await Follow.findOne({
      follower: followerId,
      following: userId
    });

    res.status(200).json({
      isFollowing: !!exists
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};