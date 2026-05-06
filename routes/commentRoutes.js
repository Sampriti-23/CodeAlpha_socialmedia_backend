// routes/commentRoutes.js

const express = require("express");

const {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
} = require("../controller/commentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", authMiddleware, createComment);

router.get("/:postId", authMiddleware, getPostComments);

router.put("/update/:commentId", authMiddleware, updateComment);

router.delete("/delete/:commentId", authMiddleware, deleteComment);

module.exports = router;