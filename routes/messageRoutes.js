const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");

const {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead,
  getUnreadCount,
  deleteMessage,
  deleteConversation,
  clearConversationMessages,
} = require("../controller/messageController");

router.get("/conversations", authMiddleware, getConversations);
router.get("/unread/count", authMiddleware, getUnreadCount);
router.get("/:userId", authMiddleware, getMessages);

router.post("/send/:receiverId", authMiddleware, sendMessage);
router.put("/read/:senderId", authMiddleware, markMessagesAsRead);

router.delete("/delete/:messageId", authMiddleware, deleteMessage);
router.delete("/conversation/:conversationId", authMiddleware, deleteConversation);
router.delete("/clear/:conversationId", authMiddleware, clearConversationMessages);

module.exports = router;