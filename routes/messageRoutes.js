const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  sendMessage,
  getMessages,
  getConversations,
} = require("../controller/messageController");


router.get("/conversations", authMiddleware, getConversations);


router.get("/:userId", authMiddleware, getMessages);


router.post("/send/:receiverId", authMiddleware, sendMessage);

module.exports = router;