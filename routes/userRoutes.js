const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authmiddleware");
const upload = require("../middleware/uploadmiddleware");
const {
  getAllUsers,
  getSingleUser,
  getMyProfile,
  updateProfile,
  deleteUser,
  getUserStats,
  removeProfilePicture,
  deactivateAccount,
} = require("../controller/userController");

// ==============================
// GET ROUTES
// ==============================
router.get("/all", authMiddleware, getAllUsers);
router.get("/me", authMiddleware, getMyProfile);
router.get("/:userId/stats", authMiddleware, getUserStats);
router.get("/:userId", authMiddleware, getSingleUser);

// ==============================
// PROFILE UPDATES & PICTURE REMOVAL
// ==============================
router.put("/update", authMiddleware, upload.single("file"), updateProfile);

// Supports PUT or DELETE for resetting profile picture to default
router.put("/remove-profile-picture", authMiddleware, removeProfilePicture);
router.delete("/remove-profile-picture", authMiddleware, removeProfilePicture);

// ==============================
// ACCOUNT MANAGEMENT
// ==============================
router.put("/deactivate", authMiddleware, deactivateAccount);
router.delete("/delete", authMiddleware, deleteUser);

module.exports = router;