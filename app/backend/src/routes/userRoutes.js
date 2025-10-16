const express = require("express");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  validateUserCreation,
  validateSignup,
  validatePrivyAuth,
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
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const isSameDomain = process.env.SAME_DOMAIN === "true";
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction && !isSameDomain ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

// @desc    User signup (public registration with Privy)
// @route   POST /api/v1/users/signup
// @access  Public
router.post(
  "/signup",
  validateSignup,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, username, address, profile, privyId, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { username },
        ...(address ? [{ address: address.toLowerCase() }] : []),
        ...(privyId ? [{ privyId }] : []),
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User already exists with this email, username, or wallet address"
      });
    }

    // Create new user with Privy authentication (no password needed)
    const user = await User.create({
      email,
      username,
      address: address?.toLowerCase(),
      privyId, // Privy user ID for authentication
      profile,
      role: role || "researcher", // Use provided role or default to researcher
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie("auth_token", token, getCookieOptions());

    res.status(201).json({
      status: "success",
      message: "Account created successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          address: user.address,
          privyId: user.privyId,
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

// @desc    Privy authentication (create or login)
// @route   POST /api/v1/users/privy-auth
// @access  Public
router.post(
  "/privy-auth",
  validatePrivyAuth,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { privyId, address } = req.body;

    // Find existing user by privyId or address
    let user = await User.findOne({
      $or: [
        { privyId },
        { address: address.toLowerCase() }
      ]
    });

    if (user) {
      // Update existing user with Privy ID if not set
      if (!user.privyId) {
        user.privyId = privyId;
      }
      // Update address if not set
      if (!user.address) {
        user.address = address.toLowerCase();
      }
      // Update last login
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        privyId,
        address: address.toLowerCase(),
        role: "researcher", // Default role
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie("auth_token", token, getCookieOptions());

    res.status(200).json({
      status: "success",
      message: user.isNew ? "Account created successfully" : "Login successful",
      data: {
        user: {
          _id: user._id,
          privyId: user.privyId,
          address: user.address,
          role: user.role,
          profile: user.profile,
          lastLogin: user.lastLogin,
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
