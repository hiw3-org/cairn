const { body, validationResult } = require("express-validator");
const User = require("../models/User");

// Validation rules for user creation
const validateUserCreation = [
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .custom(async (email) => {
      if (email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error("Email already in use");
        }
      }
      return true;
    }),

  body("username")
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens")
    .custom(async (username) => {
      if (username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          throw new Error("Username already taken");
        }
      }
      return true;
    }),

  body("address")
    .optional({ values: "falsy" })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Please provide a valid Ethereum address")
    .custom(async (address) => {
      if (address && address.trim() !== "") {
        const existingUser = await User.findOne({ address: address.toLowerCase() });
        if (existingUser) {
          throw new Error("Wallet address already registered");
        }
      }
      return true;
    }),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),

  body("role").optional().isIn(["researcher", "funder", "admin"]).withMessage("Invalid role specified"),

  body("profile.firstName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),

  body("profile.lastName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),

  body("profile.bio").optional().isLength({ max: 500 }).withMessage("Bio cannot exceed 500 characters"),
];

// Validation rules for signup (stricter requirements)
const validateSignup = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error("Email already in use");
      }
      return true;
    }),

  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens")
    .custom(async (username) => {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new Error("Username already taken");
      }
      return true;
    }),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),

  body("address")
    .optional({ values: "falsy" })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Please provide a valid Ethereum address")
    .custom(async (address) => {
      if (address && address.trim() !== "") {
        const existingUser = await User.findOne({ address: address.toLowerCase() });
        if (existingUser) {
          throw new Error("Wallet address already registered");
        }
      }
      return true;
    }),
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array(), // Include specific errors
      details: errors.array().map((err) => `${err.path}: ${err.msg}`),
    });
  }
  next();
};

module.exports = {
  validateUserCreation,
  validateSignup,
  handleValidationErrors,
};
