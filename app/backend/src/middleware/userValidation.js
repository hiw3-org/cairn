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

// Validation rules for signup (Privy authentication only - no password needed)
const validateSignup = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens"),

  body("address")
    .optional({ values: "falsy" })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Please provide a valid Ethereum address"),

  body("privyId")
    .notEmpty()
    .withMessage("Privy ID is required")
    .matches(/^did:privy:[a-z0-9]+$/)
    .withMessage("Invalid Privy ID format"),

  body("role")
    .optional()
    .isIn(["researcher", "funder"])
    .withMessage("Role must be either researcher or funder"),

  body("profile.firstName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),

  body("profile.lastName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),

  body("profile.institution")
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage("Institution must be between 1 and 200 characters"),

  body("profile.department")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Department must be between 1 and 100 characters"),

  body("profile.bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),
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

// Validation rules for Privy authentication
const validatePrivyAuth = [
  body("privyId")
    .notEmpty()
    .withMessage("Privy ID is required")
    .matches(/^did:privy:[a-z0-9]+$/)
    .withMessage("Invalid Privy ID format"),

  body("address")
    .notEmpty()
    .withMessage("Wallet address is required")
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Please provide a valid Ethereum address"),
];

module.exports = {
  validateUserCreation,
  validateSignup,
  validatePrivyAuth,
  handleValidationErrors,
};
