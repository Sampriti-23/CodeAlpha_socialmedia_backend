const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
    // 🟢 Define isVideo inside the params callback where 'file' exists
    const isVideo = file.mimetype ? file.mimetype.startsWith("video/") : false;
    return {
        folder: "friendwave_media",
        resource_type: isVideo ? "video" : "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp","mp4"],
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
