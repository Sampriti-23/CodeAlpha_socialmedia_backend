
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  content: {
    type: String,
    required: true,
    maxLength: 500,
  },

  image: {
    type: String,
    default: "",
  },

  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  commentsCount: {
    type: Number,
    default: 0,
  },

},
{
  timestamps: true,
});

module.exports = mongoose.model(
  "Post",
  PostSchema
);