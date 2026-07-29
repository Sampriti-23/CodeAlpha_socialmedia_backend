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

    // 🟢 REAL-TIME EMIT TO RECEIVER
    const io = req.app.get("io");
    const getReceiverSocketId = req.app.get("getReceiverSocketId");
    const receiverSocketId = getReceiverSocketId ? getReceiverSocketId(receiverId) : null;

    if (receiverSocketId && io) {
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

// 2. Get Messages
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

    // 🟢 FIX: Populate sender details so it matches sendMessage format
    const messages = await Message.find({ conversationId: conversation._id })
      .populate("sender", "username profilePicture");

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

// 3. Get Conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: { $in: [userId] },
    })
      .populate("participants", "username profilePicture")
      .sort({ updatedAt: -1 })
      .lean();

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const lastMsg = await Message.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: userId },
          isRead: false,
        });

        return {
          ...conv,
          lastMessageObj: lastMsg,
          unreadCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: conversationsWithUnread,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Mark Messages as Read
const markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const currentUserId = req.user._id;

    if (!senderId || senderId === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid sender ID provided." });
    }

    // 1. Update in MongoDB
    const updateResult = await Message.updateMany(
      { sender: senderId, isRead: false },
      { $set: { isRead: true } }
    );

    // 🟢 2. FIX: EMIT REAL-TIME SOCKET EVENT TO THE SENDER
    // Tells the original sender that currentUserId has opened and read their messages
    const io = req.app.get("io");
    const getReceiverSocketId = req.app.get("getReceiverSocketId");
    const senderSocketId = getReceiverSocketId ? getReceiverSocketId(senderId) : null;

    if (senderSocketId && io) {
      io.to(senderSocketId).emit("messagesRead", { readerId: currentUserId });
    }

    res.status(200).json({ 
      success: true, 
      message: "Messages marked as read",
      modifiedCount: updateResult.modifiedCount 
    });

  } catch (error) {
    console.error("❌ CRITICAL ERROR in /read/:senderId route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
