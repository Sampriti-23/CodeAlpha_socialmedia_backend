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

    expiresAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

storySchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 86400 }
);

module.exports = mongoose.model("Story", storySchema);