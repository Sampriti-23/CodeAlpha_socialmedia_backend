const express = require("express");
const { createstory, getStories, getStoryById, deleteStory,viewStory } = require("../controller/storyController");
const authMiddleware = require("../middleware/authmiddleware");
const upload = require("../middleware/uploadmiddleware");

const router = express.Router();

router.post("/create", authMiddleware, upload.single("file"), createstory);
router.get("/all", authMiddleware, getStories);
router.get("/:id", authMiddleware, getStoryById);
router.delete("/:id", authMiddleware, deleteStory);
router.put("/view/:id", authMiddleware, viewStory); 

module.exports = router;