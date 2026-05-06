const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxLength: 500 },
  image: { type: String, default: "" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // ADD THIS:
  commentsCount: { type: Number, default: 0 } // Useful for showing "Comment count" in the feed without fetching all comments
}, { timestamps: true });