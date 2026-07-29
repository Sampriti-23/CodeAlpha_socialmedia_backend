const express = require("express");

const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
} = require("../controller/followController");

const authMiddleware = require("../middleware/authmiddleware");
const router = express.Router();

router.post("/follow", authMiddleware, followUser);
router.delete("/unfollow", authMiddleware, unfollowUser);
router.get("/followers/:userId", authMiddleware, getFollowers);
router.get("/following/:userId", authMiddleware, getFollowing);
router.get("/check-follow/:userId", authMiddleware, checkFollowStatus);


module.exports = router;