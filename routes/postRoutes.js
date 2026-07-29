const express = require("express");

const {
  createPost,
  getAllPosts,
  getSinglePost,
  updatePost,
  deletePost,
  toggleLikePost,
  getMyPosts,
  getTimelinePosts,
  getUserPosts
} = require("../controller/postController");

const authMiddleware = require("../middleware/authmiddleware");
const upload = require("../middleware/uploadmiddleware");

const router = express.Router();
router.get("/timeline", authMiddleware, getTimelinePosts);

router.post("/create", authMiddleware, upload.single("image"), createPost);

router.get("/all", authMiddleware, getAllPosts);

router.get("/myposts", authMiddleware, getMyPosts);

router.get("/:postId", authMiddleware, getSinglePost);

router.put("/update/:postId", authMiddleware, upload.single("image"), updatePost);

router.delete("/delete/:postId", authMiddleware, deletePost);

router.put("/like/:postId", authMiddleware, toggleLikePost);

router.get("/user/:userId", authMiddleware, getUserPosts);

module.exports = router;