const jwt = require("jsonwebtoken");

const User = require("../models/User");

const authMiddleware = async (
  req,
  res,
  next
) => {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token =
      authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // =========================
    // GET USER FROM DB
    // =========================

    const user = await User.findById(
      decoded.id
    );

    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;