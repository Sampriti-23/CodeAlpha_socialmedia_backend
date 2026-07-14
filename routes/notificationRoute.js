const express = require("express");
const { getNotifications, markAsRead } = require("../controller/notificationController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.put("/read", authMiddleware, markAsRead);

module.exports = router;