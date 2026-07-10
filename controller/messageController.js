const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// 1. Send Message
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { receiverId } = req.params;
    const senderId = req.user._id;

   
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });


    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      text: text,
    });

    conversation.lastMessage = text;
    conversation.updatedAt = new Date();

    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "username profilePicture");
   
    const io = req.app.get("io");
    const userSocketMap = req.app.get("userSocketMap");
    

    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populatedMessage);
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getMessages = async (req, res) => {
  try {
    const { userId: receiverId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      return res.status(200).json({ success: true, data: [] });
    }

    const messages = await Message.find({ conversationId: conversation._id });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: { $in: [userId] },
    }) .populate("participants", "username profilePicture")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;

    // 1. Verify senderId exists before querying MongoDB
    if (!senderId || senderId === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid sender ID provided." });
    }

    // 2. Update all unread messages sent by this friend
    const updateResult = await Message.updateMany(
      { sender: senderId, isRead: false },
      { $set: { isRead: true } }
    );

    // 3. Return success
    res.status(200).json({ 
      success: true, 
      message: "Messages marked as read",
      modifiedCount: updateResult.modifiedCount 
    });

  } catch (error) {
    // This logs the exact crash reason directly in your Node terminal
    console.error("❌ CRITICAL ERROR in /read/:senderId route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead,
};
