const Notification = require("../models/Notification");

// Fetch logged-in user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.user._id })
      .populate("sender", "username profilePicture")
      .populate("post", "media")
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark notifications as read when the user opens the dropdown
exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { receiver: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};