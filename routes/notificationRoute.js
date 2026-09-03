const express = require("express");
const { getNotifications, markAsRead,getUnreadCount } = require("../controller/notificationController");
const authMiddleware = require("../middleware/authmiddleware");
const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.put("/read", authMiddleware, markAsRead);
router.get("/unread/count", authMiddleware, getUnreadCount);
router.get("/unread-count", authMiddleware, getUnreadCount);

module.exports = router;