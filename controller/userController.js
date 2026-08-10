const User = require("../models/User");
const Follow = require("../models/Follow");
const Post = require("../models/Post");
const cloudinary = require("../config/cloudinary"); // আপনার Cloudinary configuration path অনুযায়ী adjust করুন

// Default profile picture URL
const DEFAULT_PROFILE_PICTURE = "https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png";

// Cloudinary URL থেকে Public ID বের করার Helper function
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("res.cloudinary.com")) return null;

  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return null;

  let pathAfterUpload = url.substring(uploadIndex + "/upload/".length);

  // version string (e.g. v1723234234/ or v1/) রিমুভ করা
  pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, "");

  // File extension (.jpg, .png, .webp etc.) রিমুভ করা
  const lastDotIndex = pathAfterUpload.lastIndexOf(".");
  if (lastDotIndex !== -1) {
    pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
  }

  return pathAfterUpload;
};

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
      // Clean up previous Cloudinary avatar if custom image exists
      const existingUser = await User.findById(req.user._id);
      if (
        existingUser?.profilePicture &&
        existingUser.profilePicture !== DEFAULT_PROFILE_PICTURE &&
        !existingUser.profilePicture.includes("default-avatar")
      ) {
        try {
          const oldPublicId = getPublicIdFromUrl(existingUser.profilePicture);
          if (oldPublicId && oldPublicId !== "default-avatar") {
            await cloudinary.uploader.destroy(oldPublicId);
          }
        } catch (cloudinaryErr) {
          console.error("Cloudinary destroy warning during avatar update:", cloudinaryErr.message);
        }
      }

      updateFields.profilePicture = req.file.path;
    } 
    // 2. Text payload - reset to default if empty string
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
// REMOVE / DELETE PROFILE PICTURE (WITH CLOUDINARY DESTROY)
// ==============================
exports.removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 1. Cloudinary থেকে আগের ছবিটি permanent delete/destroy করা
    if (
      user.profilePicture &&
      user.profilePicture !== DEFAULT_PROFILE_PICTURE &&
      !user.profilePicture.includes("default-avatar")
    ) {
      try {
        const publicId = getPublicIdFromUrl(user.profilePicture);
        if (publicId && publicId !== "default-avatar") {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudinaryErr) {
        console.error("Cloudinary destroy warning:", cloudinaryErr.message);
      }
    }

    // 2. Database-এ default picture সেট করা
    user.profilePicture = DEFAULT_PROFILE_PICTURE;
    await user.save();

    // 3. Updated user object রিটার্ন করা (password ছাড়া)
    const updatedUser = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile picture deleted from Cloudinary and reset to default.",
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