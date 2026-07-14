const express = require("express");
// 🟢 Ensure 'createComment' is imported here
const { createComment, getPostComments, deleteComment } = require("../controller/commentController"); 
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", authMiddleware, createComment);
router.post("/:postId", authMiddleware, createComment); 
router.get("/:postId", authMiddleware, getPostComments);
router.delete("/delete/:commentId", authMiddleware, deleteComment);

module.exports = router;