const express = require("express");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  validateUserCreation,
  validateSignup,
  handleValidationErrors,
} = require("../middleware/userValidation");
const {
  generateToken,
  generateRefreshToken,
  localAuth,
  authenticate,
  authorize,
} = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// Cookie configuration
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// @desc    User signup (public registration)
// @route   POST /api/v1/users/signup
// @access  Public
router.post(
  "/signup",
  validateSignup,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, username, password, address, profile } = req.body;

    // Create new user
    const user = await User.create({
      email,
      username,
      password,
      address: address?.toLowerCase(),
      profile,
      role: "researcher", // Default role for signup
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie("auth_token", token, getCookieOptions());

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      status: "success",
      message: "Account created successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          address: user.address,
          role: user.role,
          profile: user.profile,
          createdAt: user.createdAt,
        },
      },
    });
  })
);

// @desc    Create user (admin only)
// @route   POST /api/v1/users
// @access  Private (Admin)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateUserCreation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, username, password, address, role, profile, permissions } =
      req.body;

    // Create new user
    const user = await User.create({
      email,
      username,
      password,
      address: address?.toLowerCase(),
      role: role || "researcher",
      profile,
      permissions,
    });

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          address: user.address,
          role: user.role,
          profile: user.profile,
          permissions: user.permissions,
          createdAt: user.createdAt,
        },
      },
    });
  })
);

// @desc    User login
// @route   POST /api/v1/users/login
// @access  Public
router.post(
  "/login",
  localAuth,
  asyncHandler(async (req, res) => {
    const user = req.user;

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie("auth_token", token, getCookieOptions());

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          address: user.address,
          role: user.role,
          profile: user.profile,
          lastLogin: user.lastLogin,
        },
      },
    });
  })
);

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          address: user.address,
          role: user.role,
          profile: user.profile,
          integrations: user.integrations,
          permissions: user.permissions,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  })
);

// @desc    User logout
// @route   POST /api/v1/users/logout
// @access  Public
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    res.clearCookie("auth_token");
    res.status(200).json({
      status: "success",
      message: "Logout successful",
    });
  })
);

// @desc    Get all users (admin only)
// @route   GET /api/v1/users
// @access  Private (Admin)
router.get(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.status(200).json({
      status: "success",
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  })
);

// Test route (keep for now)
router.get(
  "/test",
  asyncHandler(async (req, res) => {
    res.status(200).json({
      status: "success",
      message: "User test route working!",
    });
  })
);

module.exports = router;
