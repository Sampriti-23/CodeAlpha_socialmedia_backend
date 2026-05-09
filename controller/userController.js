const User = require("../models/User");
const Follow = require("../models/Follow");
const Post = require("../models/Post");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      data: users,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSingleUser =
async (req, res) => {

  try {

    const user =
      await User.findById(
        req.params.userId
      ).select("-password");

    res.status(200).json({

      success: true,

      data: user,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,
    });
  }
};
const getMyProfile =
async (req, res) => {

  try {

    const user =
      await User.findById(
        req.user._id
      ).select("-password");

    res.status(200).json({

      success: true,

      data: user,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(

  req.user._id,

  {
    bio: req.body.bio,

    profilePicture:
    req.body.profilePicture,
  },

  {
    returnDocument: "after",
  }

).select("-password");

    res.status(200).json({
      success: true,
      data: updatedUser,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserStats = async (
  req,
  res
) => {

  try {

    const { userId } =
      req.params;

    const followersCount =
      await Follow.countDocuments({

        following: userId,
      });

    const followingCount =
      await Follow.countDocuments({

        follower: userId,
      });

    const postCount =
      await Post.countDocuments({

        author: userId,
      });

    res.status(200).json({

      success: true,

      data: {

        followersCount,

        followingCount,

        postCount,
      },
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,
    });
  }
};
module.exports = {
  getAllUsers,
  getSingleUser,
  getMyProfile,
  updateProfile,
  deleteUser,
  getUserStats,
};

