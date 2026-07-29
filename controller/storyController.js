const Story = require("../models/Story");
const User = require("../models/User");

// ==============================
// CREATE STORY
// ==============================
exports.createstory = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image or video for the story.",
      });
    }

    const mediaUrl = req.file.path; // Cloudinary URL

    const newStory = new Story({
      user: userId,
      media: mediaUrl,
      mediaType: req.body.mediaType || "image",
      caption: req.body.caption || "",
    });

    await newStory.save();

    res.status(201).json({
      success: true,
      message: "Story created successfully",
      story: newStory,
    });
  } catch (err) {
    console.error("Create Story Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================
// GET STORIES
// ==============================
exports.getStories = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const allowedUsers = [...currentUser.following, req.user._id];

    const stories = await Story.find({
      user: { $in: allowedUsers },
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers.user", "username profilePicture")
      .sort({ createdAt: 1 });

    const groupedStories = {};

    stories.forEach((story) => {
      const userId = story.user._id.toString();
      if (!groupedStories[userId]) {
        groupedStories[userId] = {
          user: story.user,
          stories: [],
        };
      }
      groupedStories[userId].stories.push(story);
    });

    let result = Object.values(groupedStories);

    result.sort((a, b) => {
      const aIsCurrentUser = a.user._id.toString() === req.user._id.toString();
      const bIsCurrentUser = b.user._id.toString() === req.user._id.toString();

      if (aIsCurrentUser) return -1;
      if (bIsCurrentUser) return 1;
      return 0;
    });

    res.status(200).json({
      success: true,
      message: "Stories fetched successfully",
      stories: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================
// GET STORY BY ID
// ==============================
exports.getStoryById = async (req, res) => {
  try {
    const storyId = req.params.id;
    const story = await Story.findById(storyId).populate("user", "username profilePicture");

    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    res.status(200).json({
      success: true,
      message: "Story fetched successfully",
      story: story,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==============================
// DELETE STORY
// ==============================
exports.deleteStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this story",
      });
    }

    await story.deleteOne();

    res.status(200).json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==============================
// VIEW STORY
// ==============================
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const alreadyViewed = story.viewers.some(
      (viewer) => viewer.user.toString() === req.user._id.toString()
    );

    if (!alreadyViewed) {
      story.viewers.push({ user: req.user._id });
      await story.save();
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};