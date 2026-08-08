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
} = require("../controller/userController");

console.log({
  authMiddleware,
  getAllUsers,
  getSingleUser,
  getMyProfile,
  updateProfile,
  deleteUser,
  getUserStats,
  removeProfilePicture,
});

router.get("/all", authMiddleware, getAllUsers);

router.get("/me", authMiddleware, getMyProfile);

router.get("/:userId/stats", authMiddleware, getUserStats);

router.get("/:userId", authMiddleware, getSingleUser);

router.put("/update", authMiddleware,upload.single("file"), updateProfile);

router.put("/remove-profile-picture", authMiddleware, removeProfilePicture);

router.delete("/delete", authMiddleware, deleteUser);


module.exports = router;