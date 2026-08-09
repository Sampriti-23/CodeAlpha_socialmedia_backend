const User = require("../models/User");
const Follow = require("../models/Follow");
const Post = require("../models/Post");

// Default profile picture URL (Replace with your actual hosted image or default asset path)
const DEFAULT_PROFILE_PICTURE = "https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png";

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

    // 1. New file upload via Cloudinary / Multer
    if (req.file) {
      updateFields.profilePicture = req.file.path;
    } 
    // 2. Text payload - reset to default if empty string or explicitly requested
    else if (typeof req.body.profilePicture === "string") {
      updateFields.profilePicture = req.body.profilePicture.trim() === "" 
        ? DEFAULT_PROFILE_PICTURE 
        : req.body.profilePicture;
    }

    // 3. Bio update
    if (typeof req.body.bio === "string") {
      updateFields.bio = req.body.bio;
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
// DELETE PROFILE PICTURE
// ==============================
exports.deleteProfilePicture = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profilePicture: DEFAULT_PROFILE_PICTURE } },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully. Reset to default.",
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

// ==============================
// DEACTIVATE ACCOUNT
// ==============================
exports.deactivateAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { isDeactivated: true } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};