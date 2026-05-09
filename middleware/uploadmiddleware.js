const multer = require('multer');
const path = require('path');

// 1. Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Files will be saved in backend/public/images
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        // Creates a unique name: current timestamp + original file extension
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// 2. Filter files (Only allow images)
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|webp/;
    const isExtensionValid = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const isMimeValid = allowedFileTypes.test(file.mimetype);

    if (isExtensionValid && isMimeValid) {
        cb(null, true);
    } else {
        cb(new Error("Only .jpeg, .jpg, .png, or .webp files are allowed!"), false);
    }
};

// 3. Initialize Multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: fileFilter
});

module.exports = upload;