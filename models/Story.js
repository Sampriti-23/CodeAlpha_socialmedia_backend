const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    media: {
        type: String,
        required: true
    },

    mediaType: {
        type: String,
        enum: ["image", "video"],
        default: "image"
    },

    caption: {
        type: String,
        maxlength: 200,
        default: ""
    },

    viewers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }],

// ... inside your storySchema ...
    expiresAt: {
        type: Date,
        // 🟢 FIX 1: Set the expiration date to exactly 24 hours in the future
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) 
    }
}, {
    timestamps: true
});

// 🟢 FIX 2: Because the date is already set to 24 hours in the future, 
// tell MongoDB to delete it exactly at that time (0 seconds after expiresAt)
storySchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 } 
);

module.exports = mongoose.model("Story", storySchema);