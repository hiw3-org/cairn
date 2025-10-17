const express = require("express");
const { asyncHandler } = require("../middleware/errorHandler");
const { authenticate } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");
const onrampController = require("../controllers/onrampController");

const router = express.Router();

/**
 * Validation middleware for MoonPay URL generation
 */
const validateMoonPayRequest = [
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
    .notEmpty()
    .withMessage("Currency code is required")
    .isString()
    .withMessage("Currency code must be a string")
    .isIn(["fil", "FIL", "eth", "ETH", "usdc", "USDC"])
    .withMessage("Unsupported currency code (supported: fil, eth, usdc)"),
  body("baseCurrencyCode")
    .notEmpty()
    .withMessage("Base currency code is required")
    .isString()
    .withMessage("Base currency code must be a string")
    .isIn(["usd", "eur", "gbp"])
    .withMessage("Unsupported base currency (supported: usd, eur, gbp)"),
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
 * @desc    Generate signed MoonPay onramp URL
 * @route   POST /api/v1/onramp/moonpay-url
 * @access  Private (requires authentication)
 */
router.post(
  "/moonpay-url",
  authenticate,
  validateMoonPayRequest,
  handleValidationErrors,
  asyncHandler(onrampController.generateMoonPayUrl)
);

/**
 * @desc    MoonPay webhook for transaction status updates
 * @route   POST /api/v1/onramp/moonpay-webhook
 * @access  Public (webhook signature verified)
 * @note    This endpoint is called by MoonPay to notify of transaction status changes
 */
router.post(
  "/moonpay-webhook",
  asyncHandler(onrampController.handleMoonPayWebhook)
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
