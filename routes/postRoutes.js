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

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/timeline", authMiddleware, getTimelinePosts);

router.post("/create", authMiddleware, createPost);

router.get("/all", authMiddleware, getAllPosts);

router.get("/myposts", authMiddleware, getMyPosts);

router.get("/:postId", authMiddleware, getSinglePost);

router.put("/update/:postId", authMiddleware, updatePost);

router.delete("/delete/:postId", authMiddleware, deletePost);

router.put("/like/:postId", authMiddleware, toggleLikePost);

router.get("/user/:userId", authMiddleware, getUserPosts);

module.exports = router;