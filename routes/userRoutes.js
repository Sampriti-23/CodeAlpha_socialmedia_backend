const express = require("express");
const router = express.Router();

// Middlewares
const authMiddleware = require("../middleware/authmiddleware");
const upload = require("../middleware/uploadmiddleware");

// Controllers
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

// ==============================
// PROFILE MANAGEMENT
// ==============================
router.put("/update", authMiddleware, upload.single("file"), updateProfile);

// Handles both PUT and DELETE for removing profile picture
router.put("/remove-profile-picture", authMiddleware, removeProfilePicture);
router.delete("/remove-profile-picture", authMiddleware, removeProfilePicture);

// ==============================
// ACCOUNT MANAGEMENT
// ==============================
router.put("/deactivate", authMiddleware, deactivateAccount);
router.delete("/delete", authMiddleware, deleteUser);

// ==============================
// USER BY ID ROUTES
// ==============================
router.get("/:userId/stats", authMiddleware, getUserStats);
router.get("/:userId", authMiddleware, getSingleUser);

module.exports = router;