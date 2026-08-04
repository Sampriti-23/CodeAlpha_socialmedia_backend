const Post = require("../models/Post");
const User = require("../models/User");
const Follow = require("../models/Follow");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// ==========================================
// GET TIMELINE POSTS (Following + Self)
// ==========================================
exports.getTimelinePosts = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User ID missing",
      });
    }

    const currentUser = await User.findById(userId).select("following");
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userFollowingArray = currentUser.following || [];
    const followDocs = await Follow.find({ follower: userId }).select("following");
    const followModelArray = followDocs.map((f) => f.following);

    const rawIds = [
      userId.toString(),
      ...userFollowingArray.map((id) => id.toString()),
      ...followModelArray.map((id) => id.toString()),
    ];

    const uniqueStringIds = [...new Set(rawIds)];
    const targetSearchIds = [];
    uniqueStringIds.forEach((idStr) => {
      targetSearchIds.push(idStr);
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        targetSearchIds.push(new mongoose.Types.ObjectId(idStr));
      }
    });

    const posts = await Post.find({
      $or: [
        { user: { $in: targetSearchIds } },
        { userId: { $in: targetSearchIds } },
        { author: { $in: targetSearchIds } },
      ],
    })
      .populate({ path: "user", select: "username profilePicture email", strictPopulate: false })
      .populate({ path: "userId", select: "username profilePicture email", strictPopulate: false })
      .populate({ path: "author", select: "username profilePicture email", strictPopulate: false })
      .populate({ path: "likes", select: "username profilePicture", strictPopulate: false })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalPosts: posts.length,
      data: posts,
    });
  } catch (error) {
    console.error("❌ Timeline Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching timeline posts",
      error: error.message,
    });
  }
};

// ==============================
// CREATE POST (IMAGE + VIDEO SUPPORT)
// ==============================
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let imageUrl = "";
    let videoUrl = "";

    if (req.file) {
      const isVideo =
        req.file.mimetype?.startsWith("video/") ||
        req.file.path?.includes("/video/upload/");

      if (isVideo) {
        videoUrl = req.file.path;
      } else {
        imageUrl = req.file.path;
      }
    } else {
      imageUrl = req.body.image || "";
      videoUrl = req.body.video || "";
    }

    const post = await Post.create({
      author: req.user._id,
      content: content,
      image: imageUrl,
      video: videoUrl,
    });

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "username email profilePicture"
    );

    const followers = await Follow.find({ following: req.user._id });
    const io = req.app.get("socketio");

    followers.forEach(async (f) => {
      let newNotif = await Notification.create({
        receiver: f.follower,
        sender: req.user._id,
        type: "new_post",
        post: post._id,
        message: `${populatedPost.author.username} added a new post.`,
      });

      newNotif = await newNotif.populate("sender", "username profilePicture");

      if (io) {
        io.emit("getNotification", newNotif);
      }
    });

    res.status(201).json({
      success: true,
      data: populatedPost,
    });
  } catch (error) {
    console.error("❌ Create Post Error:", error);
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
      .populate("author", "username email profilePicture")
      .populate("likes", "username profilePicture")
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
// GET SINGLE POST BY ID
// ==============================
exports.getSinglePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate("author", "username profilePicture email")
      .populate({ path: "likes", select: "username profilePicture", strictPopulate: false })
      .populate({ path: "comments.user", select: "username profilePicture", strictPopulate: false });

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error("❌ Error fetching single post:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching single post",
      error: error.message,
    });
  }
};

// ==============================
// UPDATE POST (IMAGE + VIDEO SUPPORT)
// ==============================
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    post.content = content !== undefined ? content : post.content;

    if (req.file) {
      const isVideo =
        req.file.mimetype?.startsWith("video/") ||
        req.file.path?.includes("/video/upload/");

      if (isVideo) {
        post.video = req.file.path;
        post.image = "";
      } else {
        post.image = req.file.path;
        post.video = "";
      }
    } else {
      if (req.body.image !== undefined) post.image = req.body.image;
      if (req.body.video !== undefined) post.video = req.body.video;
    }

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
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
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
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      await post.save();

      const updatedPost = await Post.findById(postId).populate("likes", "username profilePicture");

      return res.status(200).json({
        success: true,
        liked: false,
        totalLikes: updatedPost.likes.length,
        likes: updatedPost.likes,
      });
    }

    post.likes.push(userId);
    await post.save();

    const updatedPost = await Post.findById(postId).populate("likes", "username profilePicture");

    if (post.author.toString() !== userId.toString()) {
      const currentUser = await User.findById(userId);

      let newNotif = await Notification.create({
        receiver: post.author,
        sender: userId,
        type: "like",
        post: post._id,
        message: `${currentUser.username} liked your post.`,
      });

      newNotif = await newNotif.populate("sender", "username profilePicture");
      newNotif = await newNotif.populate("post", "image video content");

      const io = req.app.get("socketio");
      if (io) {
        io.emit("getNotification", newNotif);
      }
    }

    res.status(200).json({
      success: true,
      liked: true,
      totalLikes: updatedPost.likes.length,
      likes: updatedPost.likes,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error liking post",
      error: error.message,
    });
  }
};

// ==============================
// GET POSTS OF LOGGED-IN USER
// ==============================
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate("author", "username email profilePicture")
      .populate("likes", "username profilePicture")
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

// ==============================
// GET POSTS OF A SPECIFIC USER
// ==============================
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({
      $or: [{ author: userId }, { user: userId }, { userId: userId }],
    })
      .populate("author", "username email profilePicture")
      .populate({ path: "likes", select: "username profilePicture", strictPopulate: false })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalPosts: posts.length,
      data: posts,
    });
  } catch (error) {
    console.log("❌ Error fetching user posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user posts",
      error: error.message,
    });
  }
};