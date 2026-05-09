const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const upload = require('./middleware/uploadmiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const followRoutes = require('./routes/followRoutes');
const commentRoutes = require('./routes/commentRoutes');

dotenv.config();

const app = express();

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

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`FRIENDWAVE Backend running on http://localhost:${PORT}`);
});