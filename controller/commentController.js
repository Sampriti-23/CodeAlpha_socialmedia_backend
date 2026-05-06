// controller/commentController.js

const Comment = require("../models/Comment");
const Post = require("../models/Post");

exports.createComment = async (req, res) => {
  try {
    const { postId, text } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      text,
    });

    post.commentsCount += 1;
    await post.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "username profilePicture")
      .populate("post");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: populatedComment,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error creating comment",
      error: error.message,
    });
  }
};

exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .populate("author", "username profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalComments: comments.length,
      data: comments,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error fetching comments",
      error: error.message,
    });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }
    comment.text = text;
    await comment.save();
    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "username profilePicture")
      .populate("post");
    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: populatedComment,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({  
      success: false,
      message: "Error updating comment",
      error: error.message,
    });
  }
};


exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 },
    });

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error deleting comment",
      error: error.message,
    });
  }
};