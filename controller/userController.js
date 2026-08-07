const User = require("../models/User");
const Follow = require("../models/Follow");
const Post = require("../models/Post");

// ==============================
// GET ALL USERS
// ==============================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// GET SINGLE USER
// ==============================
exports.getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// GET MY PROFILE
// ==============================
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// UPDATE PROFILE
// ==============================
exports.updateProfile = async (req, res) => {
  try {
    const updateFields = {};

    // 1. If file uploaded, store Cloudinary URL
    if (req.file) {
      updateFields.profilePicture = req.file.path;
    } else if (req.body.profilePicture) {
      updateFields.profilePicture = req.body.profilePicture;
    }

    // 2. Handle text fields
    if (req.body.bio !== undefined) {
      updateFields.bio = req.body.bio;
    }
    if (req.body.username !== undefined) {
      updateFields.username = req.body.username;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true }
    ).select("-password");

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// REMOVE PROFILE PICTURE
// ==============================
exports.removeProfilePicture = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profilePicture: "" } },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile picture removed successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// DELETE USER
// ==============================
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// GET USER STATS
// ==============================
exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const followersCount = await Follow.countDocuments({ following: userId });
    const followingCount = await Follow.countDocuments({ follower: userId });
    const postCount = await Post.countDocuments({ author: userId });

    res.status(200).json({
      success: true,
      data: {
        followersCount,
        followingCount,
        postCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};