const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead
} = require("../controller/messageController");

router.get("/conversations", authMiddleware, getConversations);

router.get("/:userId", authMiddleware, getMessages);

router.post("/send/:receiverId", authMiddleware, sendMessage);

router.put("/read/:senderId", authMiddleware, markMessagesAsRead);

module.exports = router;