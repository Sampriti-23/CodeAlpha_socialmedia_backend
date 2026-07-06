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

dotenv.config();

const app = express();



const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});


const userSocketMap = {}; 

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);


  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete userSocketMap[userId];
  });
});


app.set("io", io);
app.set("userSocketMap", userSocketMap);
// -----------------------

connectDB();

app.use(express.json());
app.use(cors());

app.use(

  "/uploads",

  express.static(

    path.join(
      __dirname,
      "uploads"
    )
  )
);

app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }
        // Return only the filename string to the frontend
        res.status(200).json(req.file.filename);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`FRIENDWAVE Backend running on http://localhost:${PORT}`);
});