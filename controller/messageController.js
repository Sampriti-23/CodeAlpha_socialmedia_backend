const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// 1. Send Message
exports.sendMessage = async (req, res) => {
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

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "sender",
      "username profilePicture"
    );

    // REAL-TIME EMIT TO RECEIVER
    const io = req.app.get("io");
    const getReceiverSocketId = req.app.get("getReceiverSocketId");
    const receiverSocketId = getReceiverSocketId
      ? getReceiverSocketId(receiverId)
      : null;

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
exports.getMessages = async (req, res) => {
  try {
    const { userId: receiverId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      return res.status(200).json({ success: true, data: [] });
    }

    const messages = await Message.find({ conversationId: conversation._id }).populate(
      "sender",
      "username profilePicture"
    );

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
exports.getConversations = async (req, res) => {
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
        const lastMsg = await Message.findOne({ conversationId: conv._id }).sort({
          createdAt: -1,
        });

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
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const currentUserId = req.user._id || req.user.id;

    if (!senderId || senderId === "undefined") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid sender ID provided." });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, senderId] },
    });

    let modifiedCount = 0;
    if (conversation) {
      const updateResult = await Message.updateMany(
        { conversationId: conversation._id, sender: senderId, isRead: false },
        { $set: { isRead: true } }
      );
      modifiedCount = updateResult.modifiedCount;
    }

    const io = req.app.get("io") || req.app.get("socketio");
    const getReceiverSocketId = req.app.get("getReceiverSocketId");
    const senderSocketId = getReceiverSocketId
      ? getReceiverSocketId(senderId)
      : null;

    if (senderSocketId && io) {
      io.to(senderSocketId).emit("messagesRead", { readerId: currentUserId });
    }

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
      modifiedCount,
    });
  } catch (error) {
    console.error("❌ CRITICAL ERROR in /read/:senderId route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Unread Count (Count of users who sent new messages & total unread messages)
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1. Find all conversations the user is a participant of
    const userConversations = await Conversation.find({
      participants: userId,
    }).select("_id");

    const conversationIds = userConversations.map((c) => c._id);

    if (conversationIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          unreadCount: 0,
          unreadChatCount: 0,
          unreadUsersCount: 0,
          totalUnreadMessages: 0,
          unreadSenders: [],
        },
      });
    }

    // 2. Filter unread messages sent by OTHER participants in these conversations
    const messageFilter = {
      conversationId: { $in: conversationIds },
      sender: { $ne: userId },
      isRead: false,
    };

    // 3. Count total unread messages
    const totalUnreadMessages = await Message.countDocuments(messageFilter);

    // 4. Find distinct senders (the count of users who sent unread messages)
    const unreadSenders = await Message.distinct("sender", messageFilter);
    const unreadChatCount = unreadSenders.length;

    res.status(200).json({
      success: true,
      data: {
        unreadCount: unreadChatCount,
        unreadChatCount,
        unreadUsersCount: unreadChatCount,
        totalUnreadMessages,
        unreadSenders,
      },
    });
  } catch (error) {
    console.error("❌ CRITICAL ERROR in /unread-count route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Delete Single Message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }
    if (message.sender.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to delete this message" });
    }

    await message.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Message deleted successfully", messageId });
  } catch (error) {
    console.error("❌ CRITICAL ERROR in /delete/:messageId route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Delete Entire Conversation
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to delete this conversation" });
    }

    await conversation.deleteOne();
    await Message.deleteMany({ conversationId: conversationId });

    res.status(200).json({
      success: true,
      message: "Conversation and its messages deleted successfully",
      conversationId,
    });
  } catch (error) {
    console.error(
      "❌ CRITICAL ERROR in /delete-conversation/:conversationId route:",
      error
    );
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Clear Messages in Specific Conversation
exports.clearConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to clear this conversation" });
    }

    await Message.deleteMany({ conversationId: conversationId });
    conversation.lastMessage = "";
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "All messages in conversation cleared successfully",
      conversationId,
    });
  } catch (error) {
    console.error("❌ CRITICAL ERROR in /clear/:conversationId route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};