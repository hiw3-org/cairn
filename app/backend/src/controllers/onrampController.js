const logger = require("../utils/logger");
const { sign } = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Onramp Controller
 * Handles fiat onramp integrations (Coinbase OnRamp with secure session tokens)
 */

/**
 * Generate JWT for Coinbase CDP API authentication
 * @param {string} requestMethod - HTTP method (GET, POST, etc.)
 * @param {string} requestPath - API endpoint path
 * @returns {string} JWT token
 */
const generateCoinbaseJWT = (requestMethod, requestPath) => {
  const keyName = process.env.COINBASE_API_KEY_NAME; // e.g., "organizations/{org_id}/apiKeys/{key_id}"
  let keySecret = process.env.COINBASE_API_KEY_SECRET; // Private key in PEM format

  if (!keyName || !keySecret) {
    throw new Error("Coinbase API credentials not configured");
  }

  // Replace literal \n with actual newlines (in case .env has escaped newlines)
  keySecret = keySecret.replace(/\\n/g, '\n');

  const url = "api.developer.coinbase.com";
  const uri = `${requestMethod} ${url}${requestPath}`;

  logger.info(`JWT URI being signed: ${uri}`);

  const token = sign(
    {
      iss: "cdp", // Coinbase Developer Platform
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes
      sub: keyName,
      uri,
    },
    keySecret,
    {
      algorithm: "ES256",
      header: {
        kid: keyName,
        nonce: crypto.randomBytes(16).toString("hex"),
      },
    }
  );

  return token;
};

/**
 * Generate Coinbase OnRamp session token via API
 * This is required for secure initialization
 */
exports.getCoinbaseConfig = async (req, res) => {
  try {
    const { walletAddress, currencyCode, baseCurrencyCode, baseCurrencyAmount } = req.body;

    // Validate environment variables
    const coinbaseAppId = process.env.COINBASE_APP_ID;
    if (!coinbaseAppId) {
      logger.error("Coinbase App ID not configured");
      return res.status(500).json({
        status: "error",
        message: "Onramp service not configured. Please contact support.",
      });
    }

    // Validate wallet address format (basic validation)
    if (!walletAddress || (!walletAddress.startsWith('0x') && !walletAddress.startsWith('f'))) {
      return res.status(400).json({
        status: "error",
        message: "Invalid wallet address format",
      });
    }

    logger.info(`Coinbase OnRamp config requested for user ${req.user.id}, wallet: ${walletAddress}`);

    // Check if API credentials are configured for secure session token generation
    const hasApiCredentials = process.env.COINBASE_API_KEY_NAME && process.env.COINBASE_API_KEY_SECRET;

    if (!hasApiCredentials) {
      // Fallback to basic configuration (may not work if project requires secure initialization)
      logger.warn("Coinbase API credentials not configured. Using basic initialization (may fail if project requires session token).");

      return res.status(200).json({
        status: "success",
        data: {
          appId: coinbaseAppId,
          provider: "coinbase",
          destinationWallets: [
            {
              address: walletAddress,
              blockchains: ["filecoin"],
              assets: [currencyCode?.toUpperCase() || "FIL"]
            }
          ],
          ...(baseCurrencyCode && { defaultFiatCurrency: baseCurrencyCode.toUpperCase() }),
          ...(baseCurrencyAmount && { defaultAmount: baseCurrencyAmount.toString() }),
        },
      });
    }

    // Generate session token via Coinbase API (secure method)
    try {
      const requestPath = "/onramp/v1/token";
      const jwt = generateCoinbaseJWT("POST", requestPath);

      logger.info(`Generated JWT for Coinbase API (first 50 chars): ${jwt.substring(0, 50)}...`);

      // Extract client IP from request
      // Note: In production, extract from TCP layer, not X-Forwarded-For (can be spoofed)
      // For development behind proxies, we use X-Forwarded-For as fallback
      const clientIp = req.ip ||
                       req.connection.remoteAddress ||
                       req.socket.remoteAddress ||
                       (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                       '127.0.0.1';

      // Clean up IPv6 localhost to IPv4
      const cleanIp = clientIp.replace('::ffff:', '').replace('::1', '127.0.0.1');

      logger.info(`Generating session token for IP: ${cleanIp}`);

      // Prepare request body for session token generation
      // Format according to Coinbase API documentation
      const tokenRequestBody = {
        addresses: [
          {
            address: walletAddress,
            blockchains: ["filecoin"], // Supported blockchains for this address
          }
        ],
        assets: [currencyCode?.toUpperCase() || "FIL"], // Assets to enable
        clientIp: cleanIp, // Required: true client IP
      };

      logger.info(`Calling Coinbase API: POST https://api.developer.coinbase.com${requestPath}`);
      logger.info(`Request body: ${JSON.stringify(tokenRequestBody)}`);

      // Call Coinbase API to generate session token
      const response = await fetch(`https://api.developer.coinbase.com${requestPath}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tokenRequestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Coinbase API error: ${response.status} - ${errorText}`);
        logger.error(`Request details - Method: POST, Path: ${requestPath}, KeyName: ${process.env.COINBASE_API_KEY_NAME}`);
        throw new Error(`Coinbase API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error("No session token returned from Coinbase API");
      }

      logger.info(`Generated Coinbase session token for user ${req.user.id}`);

      // Return session token for secure initialization
      return res.status(200).json({
        status: "success",
        data: {
          appId: coinbaseAppId,
          sessionToken: data.token,
          provider: "coinbase",
        },
      });

    } catch (apiError) {
      logger.error(`Error generating Coinbase session token: ${apiError.message}`);

      // Return error with helpful message
      return res.status(500).json({
        status: "error",
        message: "Failed to generate secure session token. Please check API credentials.",
        details: apiError.message,
      });
    }

  } catch (error) {
    logger.error(`Error in getCoinbaseConfig: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Failed to generate onramp configuration",
    });
  }
};

/**
 * Handle Coinbase OnRamp events/webhooks
 * Note: Coinbase OnRamp uses event callbacks in the SDK rather than server webhooks
 * This endpoint is reserved for future webhook integration if Coinbase adds it
 */
exports.handleCoinbaseEvent = async (req, res) => {
  try {
    const event = req.body;

    logger.info(`Received Coinbase OnRamp event: ${event.type || 'unknown'}`, {
      eventData: event,
    });

    // Event handling logic can be added here
    // Currently Coinbase OnRamp uses frontend callbacks (onSuccess, onExit, onEvent)
    // This endpoint is a placeholder for future server-side event handling

    switch (event.type) {
      case "buy_succeeded":
        logger.info(`Coinbase buy succeeded: ${event.id}`);
        // TODO: Update user balance or trigger any post-purchase logic
        break;

      case "buy_failed":
        logger.warn(`Coinbase buy failed: ${event.id}`);
        break;

      default:
        logger.info(`Unhandled Coinbase event type: ${event.type}`);
    }

    res.status(200).json({
      status: "success",
      message: "Event received",
    });
  } catch (error) {
    logger.error(`Error handling Coinbase event: ${error.message}`);

    res.status(200).json({
      status: "error",
      message: "Event processing failed",
    });
  }
};

/**
 * Get list of supported currencies
 */
exports.getSupportedCurrencies = async (req, res) => {
  try {
    // Return list of supported cryptocurrencies and fiat currencies
    // Coinbase OnRamp supports many more currencies than listed here
    const supportedCurrencies = {
      crypto: [
        {
          code: "FIL",
          name: "Filecoin",
          network: "filecoin",
          recommended: true,
        },
        {
          code: "ETH",
          name: "Ethereum",
          network: "ethereum",
          recommended: false,
        },
        {
          code: "USDC",
          name: "USD Coin",
          network: "ethereum",
          recommended: false,
        },
        {
          code: "BTC",
          name: "Bitcoin",
          network: "bitcoin",
          recommended: false,
        },
      ],
      fiat: [
        { code: "USD", name: "US Dollar", symbol: "$" },
        { code: "EUR", name: "Euro", symbol: "€" },
        { code: "GBP", name: "British Pound", symbol: "£" },
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
