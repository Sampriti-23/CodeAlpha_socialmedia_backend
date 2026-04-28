const Comment = require('../models/commentModel');

//  Create a comment
exports.createComment = async (req, res) => {
    try {
        const { postId, text } = req.body;

        if (!text || text.trim() === "") {
            return res.status(400).json({ message: "Comment cannot be empty" });
        }

        const comment = new Comment({
            post: postId,
            text: text,
            author: req.user._id
        });

        await comment.save();

        res.status(201).json({
            message: "Comment created successfully",
            comment
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//  Get comments for a post
exports.getCommentsByPost = async (req, res) => {
    try {  
        const comments = await Comment.find({ post: req.params.postId })
            .populate('author', 'username')
            .sort({ createdAt: -1 }); // latest first

        res.status(200).json(comments);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//  Update a comment (only author)
exports.updateComment = async (req, res) => {
    try {
        const { text } = req.body;

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // 🔐 Check ownership
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        comment.text = text || comment.text;

        await comment.save();

        res.status(200).json({
            message: "Comment updated successfully",
            comment
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//  Delete a comment (only author)
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // 🔐 Check ownership
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await comment.deleteOne();

        res.status(200).json({
            message: "Comment deleted successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};