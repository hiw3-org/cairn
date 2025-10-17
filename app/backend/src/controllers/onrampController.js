const crypto = require("crypto");
const logger = require("../utils/logger");

/**
 * Onramp Controller
 * Handles fiat onramp integrations (MoonPay, etc.)
 */

/**
 * Generate HMAC SHA256 signature for MoonPay URL
 * @param {string} originalUrl - The URL to sign
 * @returns {string} The signature
 */
const generateMoonPaySignature = (originalUrl) => {
  const secretKey = process.env.MOONPAY_SECRET_KEY;

  if (!secretKey) {
    throw new Error("MoonPay secret key not configured");
  }

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(new URL(originalUrl).search)
    .digest("base64");

  return signature;
};

/**
 * Verify MoonPay webhook signature
 * @param {string} signature - The signature from webhook headers
 * @param {object} payload - The webhook payload
 * @returns {boolean} Whether the signature is valid
 */
const verifyMoonPayWebhookSignature = (signature, payload) => {
  const secretKey = process.env.MOONPAY_WEBHOOK_SECRET;

  if (!secretKey) {
    logger.error("MoonPay webhook secret not configured");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(JSON.stringify(payload))
    .digest("hex");

  return signature === expectedSignature;
};

/**
 * Generate signed MoonPay onramp URL
 */
exports.generateMoonPayUrl = async (req, res) => {
  try {
    const {
      walletAddress,
      email,
      currencyCode,
      baseCurrencyCode,
      baseCurrencyAmount,
    } = req.body;

    // Validate environment variables
    const moonpayApiKey = process.env.MOONPAY_PUBLISHABLE_KEY;
    if (!moonpayApiKey) {
      logger.error("MoonPay publishable key not configured");
      return res.status(500).json({
        status: "error",
        message: "Onramp service not configured. Please contact support.",
      });
    }

    // Build MoonPay URL parameters
    const params = new URLSearchParams({
      apiKey: moonpayApiKey,
      currencyCode: currencyCode.toLowerCase(), // e.g., "fil"
      walletAddress: walletAddress,
      baseCurrencyCode: baseCurrencyCode.toLowerCase(), // e.g., "usd"
      colorCode: "#6366f1", // Cairn brand color
      redirectURL: `${process.env.FRONTEND_URL}/dashboard?onramp=success`,
    });

    // Add optional parameters
    if (email) {
      params.append("email", email);
    }
    if (baseCurrencyAmount) {
      params.append("baseCurrencyAmount", baseCurrencyAmount.toString());
    }

    // MoonPay base URL (use sandbox for testing)
    const moonpayBaseUrl = process.env.MOONPAY_SANDBOX === "true"
      ? "https://buy-sandbox.moonpay.com"
      : "https://buy.moonpay.com";

    // Construct full URL
    const originalUrl = `${moonpayBaseUrl}?${params.toString()}`;

    // Generate signature
    let signedUrl = originalUrl;
    try {
      const signature = generateMoonPaySignature(originalUrl);
      signedUrl = `${originalUrl}&signature=${encodeURIComponent(signature)}`;
    } catch (signError) {
      logger.error(`Failed to sign MoonPay URL: ${signError.message}`);
      // Continue without signature (MoonPay will still work in some cases)
    }

    logger.info(`Generated MoonPay URL for user ${req.user.id}, wallet: ${walletAddress}`);

    res.status(200).json({
      status: "success",
      data: {
        url: signedUrl,
        provider: "moonpay",
      },
    });
  } catch (error) {
    logger.error(`Error generating MoonPay URL: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Failed to generate onramp URL",
    });
  }
};

/**
 * Handle MoonPay webhook for transaction updates
 */
exports.handleMoonPayWebhook = async (req, res) => {
  try {
    const signature = req.headers["moonpay-signature"];
    const payload = req.body;

    // Verify webhook signature
    if (!verifyMoonPayWebhookSignature(signature, payload)) {
      logger.warn("Invalid MoonPay webhook signature");
      return res.status(401).json({
        status: "error",
        message: "Invalid signature",
      });
    }

    // Handle different event types
    const { type, data } = payload;

    logger.info(`Received MoonPay webhook: ${type}`, {
      transactionId: data?.id,
      status: data?.status,
    });

    switch (type) {
      case "transaction_created":
        // Transaction initiated
        logger.info(`MoonPay transaction created: ${data.id}`);
        break;

      case "transaction_updated":
        // Transaction status updated
        logger.info(`MoonPay transaction updated: ${data.id}, status: ${data.status}`);

        // Handle specific statuses
        if (data.status === "completed") {
          // Transaction completed successfully
          logger.info(`MoonPay transaction completed: ${data.id}`);
          // TODO: Update user balance or trigger any post-purchase logic
        } else if (data.status === "failed") {
          // Transaction failed
          logger.warn(`MoonPay transaction failed: ${data.id}`);
        }
        break;

      default:
        logger.info(`Unhandled MoonPay webhook type: ${type}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({
      status: "success",
      message: "Webhook received",
    });
  } catch (error) {
    logger.error(`Error handling MoonPay webhook: ${error.message}`);

    // Return 200 even on error to prevent MoonPay from retrying
    res.status(200).json({
      status: "error",
      message: "Webhook processing failed",
    });
  }
};

/**
 * Get list of supported currencies
 */
exports.getSupportedCurrencies = async (req, res) => {
  try {
    // Return list of supported cryptocurrencies and fiat currencies
    const supportedCurrencies = {
      crypto: [
        {
          code: "fil",
          name: "Filecoin",
          network: "filecoin",
          recommended: true,
        },
        {
          code: "eth",
          name: "Ethereum",
          network: "ethereum",
          recommended: false,
        },
        {
          code: "usdc",
          name: "USD Coin",
          network: "ethereum",
          recommended: false,
        },
      ],
      fiat: [
        { code: "usd", name: "US Dollar", symbol: "$" },
        { code: "eur", name: "Euro", symbol: "€" },
        { code: "gbp", name: "British Pound", symbol: "£" },
      ],
    };

    res.status(200).json({
      status: "success",
      data: supportedCurrencies,
    });
  } catch (error) {
    logger.error(`Error fetching supported currencies: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch supported currencies",
    });
  }
};
