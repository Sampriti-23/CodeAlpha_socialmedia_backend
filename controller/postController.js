const Post = require("../models/Post");

// ==============================
// CREATE POST
// ==============================
exports.createPost = async (req, res) => {
  try {
    const { content, image } = req.body;

    const post = await Post.create({
      author: req.user._id,
      content,
      image,
    });

    const populatedPost = await Post.findById(post._id)
      .populate("author", "name email profilePic");

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: populatedPost,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error creating post",
      error: error.message,
    });
  }
};

// ==============================
// GET ALL POSTS
// ==============================
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email profilePic")
      .populate("likes", "name profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalPosts: posts.length,
      data: posts,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error fetching posts",
      error: error.message,
    });
  }
};

// ==============================
// GET SINGLE POST
// ==============================
exports.getSinglePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate("author", "name email profilePic")
      .populate("likes", "name profilePic");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error fetching post",
      error: error.message,
    });
  }
};

// ==============================
// UPDATE POST
// ==============================
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, image } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Only author can update
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    post.content = content || post.content;
    post.image = image || post.image;

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error updating post",
      error: error.message,
    });
  }
};

// ==============================
// DELETE POST
// ==============================
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Only author can delete
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error deleting post",
      error: error.message,
    });
  }
};

// ==============================
// LIKE / UNLIKE POST
// ==============================
exports.toggleLikePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userId = req.user._id;

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );

      await post.save();

      return res.status(200).json({
        success: true,
        message: "Post unliked",
        totalLikes: post.likes.length,
      });
    }

    // Like
    post.likes.push(userId);

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post liked",
      totalLikes: post.likes.length,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error liking/unliking post",
      error: error.message,
    });
  }
};

// ==============================
// GET POSTS OF LOGGED-IN USER
// ==============================
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      author: req.user._id,
    })
      .populate("author", "name email profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalPosts: posts.length,
      data: posts,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Error fetching your posts",
      error: error.message,
    });
  }
};