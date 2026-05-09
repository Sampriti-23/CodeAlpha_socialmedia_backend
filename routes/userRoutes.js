const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getAllUsers,
  getSingleUser,
  getMyProfile,
  updateProfile,
  deleteUser,
  getUserStats,
} = require("../controller/userController");

router.get("/all", authMiddleware, getAllUsers);

router.get("/me", authMiddleware, getMyProfile);

router.get("/:userId/stats", authMiddleware, getUserStats);

router.get("/:userId", authMiddleware, getSingleUser);

router.put("/update", authMiddleware, updateProfile);

router.delete("/delete", authMiddleware, deleteUser);


module.exports = router;