const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");

// ==============================
// CREATE COMMENT
exports.createComment = async (req, res) => {
  try {
    const postId = req.body.postId || req.params.postId;
    const text = req.body.text || req.body.comment;
    const userId = req.user._id;

    if (!postId || !text) {
      return res.status(400).json({ success: false, message: "Post ID and comment text are required" });
    }

    // 1. Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // 2. Create the comment
    let comment = await Comment.create({
      post: postId,
      user: userId,
      text: text,
    });

    // 🟢 FIX 1: Use MongoDB $push instead of JS .push() to prevent array initialization crashes
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id }
    });

    // Populate the user data so the frontend can immediately display it
    comment = await comment.populate("user", "username profilePicture");

    // ==========================================
    // TARGETED LIVE NOTIFICATION LOGIC
    // ==========================================
    if (post.author.toString() !== userId.toString()) {
      const currentUser = await User.findById(userId);
      
      // 🟢 FIX 2: Safely convert text to a String before using .substring()
      const safeText = String(text);
      
      let newNotif = await Notification.create({
        receiver: post.author, 
        sender: userId,
        type: "comment",
        post: post._id, 
        message: `${currentUser.username} commented: "${safeText.substring(0, 20)}${safeText.length > 20 ? '...' : ''}"`
      });

      newNotif = await newNotif.populate("sender", "username profilePicture");
      newNotif = await newNotif.populate("post", "image content");

      const io = req.app.get("socketio");
      
      // 🟢 FIX 3: Add || {} fallback to prevent crashes if userSocketMap isn't loaded yet
      const userSocketMap = req.app.get("userSocketMap") || {}; 
      const receiverSocketId = userSocketMap[post.author.toString()];

      if (io && receiverSocketId) {
        io.to(receiverSocketId).emit("getNotification", newNotif);
      }
    }
    // ==========================================

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    });

  } catch (error) {
    // 🟢 Prints the EXACT reason for the crash in your backend terminal!
    console.log("CRITICAL ERROR IN CREATE COMMENT:", error.message);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// ==============================
// GET COMMENTS FOR A POST
// ==============================
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Fetch comments and populate the user details (newest first)
    const comments = await Comment.find({ post: postId })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.log("Error fetching comments:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==============================
// DELETE COMMENT
// ==============================
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    // 1. Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // 2. Security Check: Only the comment author OR the post owner can delete it
    const post = await Post.findById(comment.post);
    if (
      comment.user.toString() !== userId.toString() &&
      post.author.toString() !== userId.toString()
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this comment" });
    }

    // 3. Remove the comment from the database
    await comment.deleteOne();

    // 4. Remove the comment ID from the Post's comments array
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId }
    });

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });

  } catch (error) {
    console.log("Error deleting comment:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};