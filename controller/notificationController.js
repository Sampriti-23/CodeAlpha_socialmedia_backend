const Notification = require("../models/Notification");

// ==============================
// FETCH LOGGED-IN USER'S NOTIFICATIONS
// ==============================
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notifications = await Notification.find({ receiver: userId })
      .populate("sender", "username profilePicture")
      .populate("post", "media")
      .sort({ createdAt: -1 }) // Newest first
      .limit(30)               // 🟢 Limit to latest 30 notifications for speed
      .lean();                 // 🟢 Returns plain JS objects for faster execution

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// MARK NOTIFICATIONS AS READ
// ==============================
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await Notification.updateMany(
      { receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    } 

    const unreadCount = await Notification.countDocuments({ receiver: userId, isRead: false });

    res.status(200).json({
      success: true,
      data: {
        unreadCount,
        unreadNotificationsCount: unreadCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};