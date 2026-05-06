const express = require("express");

const {
  createPost,
  getAllPosts,
  getSinglePost,
  updatePost,
  deletePost,
  toggleLikePost,
  getMyPosts,
} = require("../controller/postController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", authMiddleware, createPost);

router.get("/all", authMiddleware, getAllPosts);

router.get("/myposts", authMiddleware, getMyPosts);

router.get("/:postId", authMiddleware, getSinglePost);

router.put("/update/:postId", authMiddleware, updatePost);

router.delete("/delete/:postId", authMiddleware, deletePost);

router.put("/like/:postId", authMiddleware, toggleLikePost);

module.exports = router;