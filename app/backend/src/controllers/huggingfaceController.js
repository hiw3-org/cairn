const huggingfaceService = require("../services/huggingfaceService");
const User = require("../models/User");

/**
 * Initiate HuggingFace OAuth2 flow
 */
const initiateHFAuth = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (user?.integrations?.huggingface?.connected) {
      return res.status(400).json({
        status: "error",
        message: "HuggingFace account already connected",
      });
    }

    const authUrl = huggingfaceService.generateAuthUrl(userId);

    res.json({
      status: "success",
      data: {
        authUrl,
      },
    });
  } catch (error) {
    console.error("HF Auth initiation error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to initiate HuggingFace authentication",
    });
  }
};

/**
 * Handle OAuth2 callback from HuggingFace
 */
const handleHFCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Check for OAuth errors
    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Failed</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h1 class="error">Authorization Failed</h1>
            <p>There was an error connecting your HuggingFace account.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'hf_oauth_error', error: '${error}' }, '*');
              }
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `);
    }

    if (!code || !state) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invalid Request</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h1 class="error">Invalid Request</h1>
            <p>Missing required parameters.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'hf_oauth_error', error: 'Missing parameters' }, '*');
              }
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `);
    }

    // Exchange code for token
    const { userId, tokenData } = await huggingfaceService.exchangeCodeForToken(
      code,
      state
    );

    // Connect account
    const result = await huggingfaceService.connectAccount(userId, tokenData);

    // Send success HTML page that notifies parent and closes
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connection Successful</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .success { color: #10b981; }
            .checkmark {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: block;
              stroke-width: 3;
              stroke: #10b981;
              stroke-miterlimit: 10;
              margin: 20px auto;
              animation: fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
            }
            @keyframes scale {
              0%, 100% { transform: none; }
              50% { transform: scale3d(1.1, 1.1, 1); }
            }
          </style>
        </head>
        <body>
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h1>Successfully Connected!</h1>
          <p>Your HuggingFace account has been linked.</p>
          <p>You can close this pop-up and refresh the Cairn app to get your project imported in to the app.</p>
          <script>
            // Notify parent window of success
            if (window.opener) {
              window.opener.postMessage({ type: 'hf_oauth_success', username: '${result.profile?.name || ""}' }, '*');
            }
            // Close window after 1.5 seconds
            setTimeout(() => window.close(), 1500);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("HF Callback error:", error);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Connection Failed</h1>
          <p>There was an error connecting your HuggingFace account.</p>
          <p class="error">${error.message}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'hf_oauth_error', error: '${error.message}' }, '*');
            }
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  }
};

/**
 * Get HuggingFace connection status
 */
const getHFStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("integrations.huggingface");

    const hfIntegration = user?.integrations?.huggingface;

    if (!hfIntegration?.connected) {
      return res.json({
        status: "success",
        data: {
          connected: false,
        },
      });
    }

    res.json({
      status: "success",
      data: {
        connected: true,
        username: hfIntegration.username,
        userId: hfIntegration.userId,
        connectedAt: hfIntegration.connectedAt,
        lastSync: hfIntegration.lastSync,
        scopes: hfIntegration.scopes,
      },
    });
  } catch (error) {
    console.error("HF Status error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get HuggingFace status",
    });
  }
};

/**
 * Disconnect HuggingFace account
 */
const disconnectHF = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await huggingfaceService.disconnectAccount(userId);

    res.json({
      success: true,
      message: "HuggingFace account disconnected successfully",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    console.error("HF Disconnect error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to disconnect HuggingFace account",
      error: error.message,
    });
  }
};

/**
 * Get user's HuggingFace repositories
 */
const getHFRepos = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const repos = await huggingfaceService.getUserRepos(userId, limit);

    res.json({
      status: "success",
      data: repos,
    });
  } catch (error) {
    console.error("HF Repos error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get HuggingFace repositories",
    });
  }
};

/**
 * Get user's HuggingFace datasets
 */
const getHFDatasets = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const datasets = await huggingfaceService.getUserDatasets(userId, limit);

    res.json({
      status: "success",
      data: datasets,
    });
  } catch (error) {
    console.error("HF Datasets error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get HuggingFace datasets",
      error: error.message,
    });
  }
};

/**
 * Refresh HuggingFace connection
 */
const refreshHFConnection = async (req, res) => {
  try {
    const userId = req.user.id;

    // This will refresh the token if needed
    const accessToken = await huggingfaceService.getValidAccessToken(userId);

    // Get updated profile
    const profile = await huggingfaceService.getUserProfile(accessToken);

    res.json({
      status: "success",
      message: "HuggingFace connection refreshed successfully",
      data: {
        profile: {
          username: profile.name,
          userId: profile.id,
          avatar: profile.avatar,
          repos: profile.numRepos,
          datasets: profile.numDatasets,
        },
      },
    });
  } catch (error) {
    console.error("HF Refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh HuggingFace connection",
      error: error.message,
    });
  }
};

module.exports = {
  initiateHFAuth,
  handleHFCallback,
  getHFStatus,
  disconnectHF,
  getHFRepos,
  getHFDatasets,
  refreshHFConnection,
};
