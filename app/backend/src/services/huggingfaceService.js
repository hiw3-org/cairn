const crypto = require("crypto");
const User = require("../models/User");
const { encrypt, decrypt } = require("../utils/encryption");

class HuggingFaceService {
  constructor() {
    this.clientId = process.env.HF_CLIENT_ID;
    this.clientSecret = process.env.HF_CLIENT_SECRET;
    this.redirectUri = process.env.HF_REDIRECT_URI;
    this.baseUrl = "https://huggingface.co";
    this.apiUrl = "https://huggingface.co/api";

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      console.warn("HuggingFace OAuth2 credentials not configured");
    }
  }

  /**
   * Generate OAuth2 authorization URL
   */
  generateAuthUrl(userId) {
    const state = crypto.randomBytes(32).toString("hex") + ":" + userId;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: "profile read-repos openid",
      state: state,
    });

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, state) {
    try {
      // Verify state parameter
      const [stateHash, userId] = state.split(":");
      if (!stateHash || !userId) {
        throw new Error("Invalid state parameter");
      }

      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const tokenData = await response.json();

      return {
        userId,
        tokenData: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          scope: tokenData.scope,
        },
      };
    } catch (error) {
      throw new Error(`OAuth token exchange failed: ${error.message}`);
    }
  }

  /**
   * Get user profile from HuggingFace
   */
  async getUserProfile(accessToken) {
    try {
      // Change from /whoami to /whoami-v2
      const response = await fetch(`${this.apiUrl}/whoami-v2`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.log("Profile fetch failed. Status:", response.status);
        const errorText = await response.text();
        console.log("Error response:", errorText);
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get HF user profile: ${error.message}`);
    }
  }

  /**
   * Connect HuggingFace account to user
   */
  async connectAccount(userId, tokenData) {
    try {
      const { access_token, refresh_token, expires_in, scope } = tokenData;

      // Get user profile
      const profile = await this.getUserProfile(access_token);

      // Calculate token expiry
      const tokenExpiry = new Date();
      tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in);

      // Encrypt tokens before storing
      const encryptedAccessToken = encrypt(access_token);
      const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null;

      // Update user with HuggingFace integration
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "integrations.huggingface.connected": true,
            "integrations.huggingface.username": profile.name,
            "integrations.huggingface.userId": profile.id,
            "integrations.huggingface.accessToken": encryptedAccessToken,
            "integrations.huggingface.refreshToken": encryptedRefreshToken,
            "integrations.huggingface.tokenExpiry": tokenExpiry,
            "integrations.huggingface.scopes": scope ? scope.split(" ") : [],
            "integrations.huggingface.connectedAt": new Date(),
            "integrations.huggingface.lastSync": new Date(),
          },
        },
        { new: true, select: "-integrations.huggingface.accessToken -integrations.huggingface.refreshToken" }
      );

      return {
        success: true,
        user: updatedUser,
        profile: {
          username: profile.name,
          userId: profile.id,
          avatar: profile.avatar,
          repos: profile.numRepos,
          datasets: profile.numDatasets,
        },
      };
    } catch (error) {
      throw new Error(`Failed to connect HF account: ${error.message}`);
    }
  }

  /**
   * Disconnect HuggingFace account
   */
  async disconnectAccount(userId) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $unset: {
            "integrations.huggingface": 1,
          },
        },
        { new: true }
      );

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      throw new Error(`Failed to disconnect HF account: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(userId) {
    try {
      const user = await User.findById(userId);
      if (!user?.integrations?.huggingface?.refreshToken) {
        throw new Error("No refresh token available");
      }

      const refreshToken = decrypt(user.integrations.huggingface.refreshToken);

      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();

      // Update tokens
      const tokenExpiry = new Date();
      tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokenData.expires_in);

      await User.findByIdAndUpdate(userId, {
        $set: {
          "integrations.huggingface.accessToken": encrypt(tokenData.access_token),
          "integrations.huggingface.refreshToken": tokenData.refresh_token
            ? encrypt(tokenData.refresh_token)
            : user.integrations.huggingface.refreshToken,
          "integrations.huggingface.tokenExpiry": tokenExpiry,
          "integrations.huggingface.lastSync": new Date(),
        },
      });

      return tokenData.access_token;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userId) {
    try {
      const user = await User.findById(userId);
      if (!user?.integrations?.huggingface?.accessToken) {
        throw new Error("No HuggingFace account connected");
      }

      const tokenExpiry = new Date(user.integrations.huggingface.tokenExpiry);
      const now = new Date();

      // If token expires in less than 5 minutes, refresh it
      if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
        return await this.refreshAccessToken(userId);
      }

      return decrypt(user.integrations.huggingface.accessToken);
    } catch (error) {
      throw new Error(`Failed to get valid access token: ${error.message}`);
    }
  }

  /**
   * Get user's HuggingFace model repositories
   */
  async getUserRepos(userId, limit = 20) {
    try {
      const accessToken = await this.getValidAccessToken(userId);

      // Get user profile to get the username
      const userProfile = await this.getUserProfile(accessToken);
      const username = userProfile.name;

      console.log("Fetching models for user:", username);

      // Query user-specific models (should include private ones with proper auth)
      const response = await fetch(`${this.apiUrl}/models?author=${username}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Models API error:", errorText);
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      console.log("Models data received:", data);
      return data;
    } catch (error) {
      throw new Error(`Failed to get HF repos: ${error.message}`);
    }
  }

  /**
   * Get user's HuggingFace datasets
   */
  async getUserDatasets(userId, limit = 20) {
    try {
      const accessToken = await this.getValidAccessToken(userId);

      // Get user profile to get the username
      const userProfile = await this.getUserProfile(accessToken);
      const username = userProfile.name;

      console.log("Fetching datasets for user:", username);

      const response = await fetch(`${this.apiUrl}/datasets?author=${username}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Datasets API error:", errorText);
        throw new Error(`Failed to fetch datasets: ${response.status}`);
      }

      const data = await response.json();
      console.log("Datasets data received:", data);
      return data;
    } catch (error) {
      throw new Error(`Failed to get HF datasets: ${error.message}`);
    }
  }
}

module.exports = new HuggingFaceService();
