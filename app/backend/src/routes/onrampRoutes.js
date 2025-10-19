const express = require("express");
const { asyncHandler } = require("../middleware/errorHandler");
const { authenticate } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");
const onrampController = require("../controllers/onrampController");

const router = express.Router();

/**
 * Validation middleware for Coinbase OnRamp configuration request
 */
const validateOnrampRequest = [
  body("walletAddress")
    .notEmpty()
    .withMessage("Wallet address is required")
    .isString()
    .withMessage("Wallet address must be a string")
    .matches(/^(0x)?[0-9a-fA-F]{40}$|^f[0-9a-z]{1,}$/i)
    .withMessage("Invalid Ethereum or Filecoin wallet address"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format"),
  body("currencyCode")
    .optional()
    .isString()
    .withMessage("Currency code must be a string")
    .isIn(["fil", "FIL", "eth", "ETH", "usdc", "USDC", "btc", "BTC"])
    .withMessage("Unsupported currency code (supported: FIL, ETH, USDC, BTC)"),
  body("baseCurrencyCode")
    .optional()
    .isString()
    .withMessage("Base currency code must be a string")
    .isIn(["usd", "USD", "eur", "EUR", "gbp", "GBP"])
    .withMessage("Unsupported base currency (supported: USD, EUR, GBP)"),
  body("baseCurrencyAmount")
    .optional()
    .isFloat({ min: 10, max: 10000 })
    .withMessage("Base currency amount must be between 10 and 10000"),
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @desc    Get Coinbase OnRamp configuration
 * @route   POST /api/v1/onramp/coinbase-config
 * @access  Private (requires authentication)
 */
router.post(
  "/coinbase-config",
  authenticate,
  validateOnrampRequest,
  handleValidationErrors,
  asyncHandler(onrampController.getCoinbaseConfig)
);

/**
 * @desc    Coinbase OnRamp event handler (webhook/callback)
 * @route   POST /api/v1/onramp/coinbase-event
 * @access  Public
 * @note    This endpoint can receive events from Coinbase if configured
 */
router.post(
  "/coinbase-event",
  asyncHandler(onrampController.handleCoinbaseEvent)
);

/**
 * @desc    Get supported currencies for onramp
 * @route   GET /api/v1/onramp/supported-currencies
 * @access  Public
 */
router.get(
  "/supported-currencies",
  asyncHandler(onrampController.getSupportedCurrencies)
);

module.exports = router;
