const User = require("../models/User");
const Follow = require("../models/Follow");
const Post = require("../models/Post");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinary"); // আপনার Cloudinary configuration path অনুযায়ী adjust করুন

// Default profile picture URL
const DEFAULT_PROFILE_PICTURE = "";

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

    // 4. Username update (if provided)
    if (typeof req.body.username === "string" && req.body.username.trim() !== "") {
      const trimmedUsername = req.body.username.trim();
      const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${trimmedUsername}$`, "i") },
        _id: { $ne: req.user._id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
      }
      updateFields.username = trimmedUsername;
    }

    // 5. Email update (if provided)
    if (typeof req.body.email === "string" && req.body.email.trim() !== "") {
      const trimmedEmail = req.body.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      const existingUser = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: req.user._id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another account",
        });
      }
      updateFields.email = trimmedEmail;
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
// CHANGE PASSWORD
// ==============================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, oldPassword, newPassword, confirmPassword } = req.body;
    const existingPasswordInput = currentPassword || oldPassword;

    if (!existingPasswordInput || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if current password matches
    const isMatch = await bcrypt.compare(existingPasswordInput, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Prevent reusing identical password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as your current password",
      });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// CHANGE USERNAME
// ==============================
exports.changeUsername = async (req, res) => {
  try {
    const newUsername = (req.body.newUsername || req.body.username || "").trim();

    if (!newUsername) {
      return res.status(400).json({
        success: false,
        message: "New username is required",
      });
    }

    if (newUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters long",
      });
    }

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (currentUser.username.toLowerCase() === newUsername.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "New username must be different from current username",
      });
    }

    // Check if new username is already taken by another user (case-insensitive)
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${newUsername}$`, "i") },
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken. Please choose a different one.",
      });
    }

    currentUser.username = newUsername;
    await currentUser.save();

    const updatedUser = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      success: true,
      message: "Username updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// CHANGE EMAIL
// ==============================
exports.changeEmail = async (req, res) => {
  try {
    const newEmail = (req.body.newEmail || req.body.email || "").trim().toLowerCase();
    const { password } = req.body;

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: "New email address is required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If password confirmation is provided, verify it
    if (password) {
      const isMatch = await bcrypt.compare(password, currentUser.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Incorrect password",
        });
      }
    }

    if (currentUser.email.toLowerCase() === newEmail) {
      return res.status(400).json({
        success: false,
        message: "New email must be different from current email",
      });
    }

    // Check if new email is already taken by another user
    const existingUser = await User.findOne({
      email: newEmail,
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use by another account",
      });
    }

    currentUser.email = newEmail;
    await currentUser.save();

    const updatedUser = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      success: true,
      message: "Email updated successfully",
      data: updatedUser,
    });
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
    user.profilePicture = "";
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