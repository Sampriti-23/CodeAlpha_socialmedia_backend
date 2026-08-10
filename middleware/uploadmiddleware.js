const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");


// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {

        const isVideo = file.mimetype ? file.mimetype.startsWith("video/") : false;
        return {
            folder: "friendwave_media",
            resource_type: isVideo ? "video" : "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4"],
        };
    },
});

// Filter files (Only allow images and videos)
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "video/mp4",
    ];

    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Only .jpeg, .jpg, .png, or .webp files are allowed!"),
            false
        );
    }
};

// Initialize Multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 45 * 1024 * 1024, // 45MB
    },
});

module.exports = upload;
