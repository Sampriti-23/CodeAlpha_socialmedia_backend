const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const connectDB = require('./config/db');
const upload = require('./middleware/uploadmiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const followRoutes = require('./routes/followRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const storyRoutes = require('./routes/storyRoute');
const notificationRoute = require('./routes/notificationRoute');

dotenv.config();

const app = express();

// Standard Express Middlewares
app.use(express.json());
app.use(cors());

// HTTP & Socket.IO Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Store online users: { userId: socketId }
const userSocketMap = {}; 

// 🟢 HELPER FUNCTION: Get socket ID by User ID
const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

// 🟢 ATTACH TO EXPRESS APP (Accessible in controllers via req.app.get(...))
app.set("io", io);
app.set("userSocketMap", userSocketMap);
app.set("getReceiverSocketId", getReceiverSocketId);

// 🟢 SOCKET.IO CONNECTION HANDLER
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }

  // 🟢 1. Broadcast list of online user IDs to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // 🟢 2. REAL-TIME READ RECEIPTS
  socket.on("markAsRead", ({ senderId, receiverId }) => {
    const senderSocket = getReceiverSocketId(senderId); 
    
    if (senderSocket) {
      io.to(senderSocket).emit("messagesRead", { readerId: receiverId });
    }
  });

  // 🟢 3. DISCONNECT HANDLER
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    if (userId && userId !== "undefined") {
      delete userSocketMap[userId];
    }
    // Broadcast updated online list after disconnect
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

const allowedOrigins = [
  "http://localhost:5173",
  "https://codealpha-socialmedia-forntend.onrender.com"
];


app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Database Connection
connectDB();

// Static file storage for uploads
app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);

// File Upload Route
app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }
        res.status(200).json(req.file.filename);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/notifications', notificationRoute);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});