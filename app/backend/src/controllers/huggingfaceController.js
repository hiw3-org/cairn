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
      return res.status(400).json({
        success: false,
        message: "OAuth authorization failed",
        error: error,
      });
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: "Missing authorization code or state parameter",
      });
    }

    // Exchange code for token
    const { userId, tokenData } = await huggingfaceService.exchangeCodeForToken(
      code,
      state
    );

    // Connect account
    const result = await huggingfaceService.connectAccount(userId, tokenData);

    res.json({
      success: true,
      message: "HuggingFace account connected successfully",
      data: {
        user: result.user,
        profile: result.profile,
      },
    });
  } catch (error) {
    console.error("HF Callback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete HuggingFace authentication",
      error: error.message,
    });
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
