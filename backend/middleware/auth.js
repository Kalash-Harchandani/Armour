/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */

import jwt from "jsonwebtoken";
import User from "../models/User.js";

// WARNING: Default secret is for development only. Always set JWT_SECRET in production .env file!
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No token provided. Please log in.",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not found.",
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token.",
      });
    }
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token expired. Please log in again.",
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Authentication failed.",
    });
  }
};

/**
 * Generate JWT token for user
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: "7d" } // Token expires in 7 days
  );
};

export { JWT_SECRET };

