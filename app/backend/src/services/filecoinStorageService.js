const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { exec } = require("child_process");
const { promisify } = require("util");
const logger = require("../utils/logger");
const StorageCostCalculator = require("../utils/storageCostCalculator");

const execPromise = promisify(exec);

// Dynamic import for ES Module
let Synapse, RPC_URLS;
async function loadSynapse() {
  if (!Synapse) {
    const synapseModule = await import("@filoz/synapse-sdk");
    Synapse = synapseModule.Synapse;
    RPC_URLS = synapseModule.RPC_URLS;
  }
  return { Synapse, RPC_URLS };
}

/**
 * Filecoin Storage Service
 * Handles project storage on Filecoin via Synapse SDK
 * Integrated with cost calculation and payment verification
 */
class FilecoinStorageService {
  constructor() {
    this.synapse = null;
    this.context = null;
  }

  /**
   * Initialize Synapse SDK
   */
  async initialize() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY not found in environment variables");
    }

    try {
      // Load Synapse SDK dynamically
      const { Synapse, RPC_URLS } = await loadSynapse();

      const rpcURL = process.env.RPC_URL || RPC_URLS.calibration.http;
      this.synapse = await Synapse.create({
        privateKey,
        rpcURL,
        withCDN: true,
      });
      this.context = await this.synapse.storage.createContext();
      logger.info("Synapse SDK initialized successfully");
    } catch (error) {
      logger.error(`Failed to initialize Synapse SDK: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get storage pricing information
   * @returns {Promise<Object>} Pricing info from Synapse
   */
  async getStorageInfo() {
    if (!this.synapse) {
      await this.initialize();
    }

    const storageInfo = await this.synapse.storage.getStorageInfo();
    return storageInfo;
  }

  /**
   * Calculate storage cost estimate
   * @param {number} dataSizeBytes - Size of data
   * @param {number} daysOfStorage - Storage duration
   * @returns {Promise<Object>} Cost breakdown
   */
  async calculateStorageCost(dataSizeBytes, daysOfStorage) {
    const storageInfo = await this.getStorageInfo();
    const pricing = storageInfo.pricing.noCDN;

    return StorageCostCalculator.calculateCost(
      dataSizeBytes,
      daysOfStorage,
      pricing
    );
  }

  /**
   * Get pricing tiers for different durations
   * @param {number} dataSizeBytes - Size of data
   * @returns {Promise<Array>} Pricing options
   */
  async getPricingTiers(dataSizeBytes) {
    const storageInfo = await this.getStorageInfo();
    const pricing = storageInfo.pricing.noCDN;

    return StorageCostCalculator.getPricingTiers(dataSizeBytes, pricing);
  }

  /**
   * Download HuggingFace repository
   * @param {string} repoUrl - HuggingFace repo URL
   * @param {string} destDir - Destination directory
   * @returns {Promise<Object>} Repo info {path, size}
   */
  async downloadHuggingFaceRepo(repoUrl, destDir = "./temp/models") {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    logger.info(`Downloading HuggingFace repo: ${repoUrl}`);
    const repoName = repoUrl.split("/").pop();
    const repoPath = path.join(destDir, repoName);

    // Check if already exists
    if (fs.existsSync(repoPath)) {
      const size = this.getDirectorySize(repoPath);
      logger.info(`Repository already exists: ${repoPath}`);
      return { path: repoPath, size };
    }

    try {
      await execPromise(`git clone ${repoUrl} ${repoPath}`);

      // Delete .git folder to save space
      const gitFolderPath = path.join(repoPath, ".git");
      if (fs.existsSync(gitFolderPath)) {
        fs.rmSync(gitFolderPath, { recursive: true, force: true });
        logger.info("Removed .git folder");
      }

      const size = this.getDirectorySize(repoPath);
      logger.info(`Downloaded repo successfully. Size: ${size} bytes`);

      return { path: repoPath, size };
    } catch (error) {
      logger.error(`Failed to download repo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get directory size
   * @param {string} dirPath - Directory path
   * @returns {number} Total size in bytes
   */
  getDirectorySize(dirPath) {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }

    let totalSize = 0;

    const walkDirectory = (currentPath) => {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);

        if (item.isDirectory()) {
          walkDirectory(fullPath);
        } else if (item.isFile()) {
          totalSize += fs.statSync(fullPath).size;
        }
      }
    };

    walkDirectory(dirPath);
    return totalSize;
  }

  /**
   * Create ZIP file from directory
   * @param {string} repoPath - Path to repository
   * @returns {Promise<string>} Path to ZIP file
   */
  async createZipFile(repoPath) {
    if (!fs.existsSync(repoPath)) {
      throw new Error(`Repo path does not exist: ${repoPath}`);
    }

    const timestamp = Date.now();
    const repoName = path.basename(repoPath);
    const zipPath = path.join(process.cwd(), "temp", `${repoName}_${timestamp}.zip`);

    // Ensure temp directory exists
    const tempDir = path.dirname(zipPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    logger.info("Creating ZIP bundle...");

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        logger.info(`ZIP created: ${archive.pointer()} bytes`);
        resolve(zipPath);
      });

      archive.on("error", (err) => reject(err));
      archive.pipe(output);

      const files = fs.readdirSync(repoPath);
      files.forEach((file) => {
        const filePath = path.join(repoPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
          archive.file(filePath, { name: file });
        } else if (stat.isDirectory()) {
          archive.directory(filePath, file);
        }
      });

      archive.finalize();
    });
  }

  /**
   * Upload ZIP to Filecoin
   * @param {string} zipPath - Path to ZIP file
   * @returns {Promise<Object>} Upload result
   */
  async uploadZipToFilecoin(zipPath) {
    if (!this.synapse) {
      await this.initialize();
    }

    logger.info("Uploading ZIP bundle to Filecoin...");
    const zipData = fs.readFileSync(zipPath);
    const zipSize = zipData.length;

    const uploadResult = await this.synapse.storage.upload(zipData);

    logger.info("ZIP bundle uploaded successfully!");

    return {
      status: "success",
      cid: uploadResult.pieceCid,
      size: uploadResult.size,
      compressionRatio: ((1 - uploadResult.size / zipSize) * 100).toFixed(1),
    };
  }

  /**
   * Complete upload workflow
   * Downloads HF repo, creates ZIP, uploads to Filecoin
   * @param {string} repoUrl - HuggingFace repo URL
   * @param {number} daysOfStorage - Storage duration
   * @returns {Promise<Object>} Upload result with CID
   */
  async uploadProject(repoUrl, daysOfStorage = 90) {
    try {
      // Download repo
      const repoInfo = await this.downloadHuggingFaceRepo(repoUrl);
      const repoPath = repoInfo.path;

      // Create ZIP
      const zipPath = await this.createZipFile(repoPath);

      // Upload to Filecoin
      const uploadResult = await this.uploadZipToFilecoin(zipPath);

      // Clean up
      fs.unlinkSync(zipPath);
      fs.rmSync(repoPath, { recursive: true, force: true });
      logger.info("Cleaned up temporary files");

      return {
        ...uploadResult,
        repoUrl,
        daysOfStorage,
        originalSize: repoInfo.size,
      };
    } catch (error) {
      logger.error(`Upload project failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify payment has been made (checks Synapse Payments balance)
   * This is called AFTER user pays from frontend
   * @param {string} userAddress - User's wallet address
   * @param {string} requiredAmount - Required amount in wei
   * @returns {Promise<boolean>} Whether payment is sufficient
   */
  async verifyPayment(userAddress, requiredAmount) {
    if (!this.synapse) {
      await this.initialize();
    }

    try {
      // In production, you'd check if the user's address has deposited
      // to the Synapse Payments contract
      // For now, we check the contract's balance
      const balance = await this.synapse.payments.balance();
      const required = BigInt(requiredAmount);

      logger.info(`Payment verification - Balance: ${ethers.formatUnits(balance, 18)} USDFC`);
      logger.info(`Required: ${ethers.formatUnits(required, 18)} USDFC`);

      return balance >= required;
    } catch (error) {
      logger.error(`Payment verification failed: ${error.message}`);
      return false;
    }
  }
}

module.exports = new FilecoinStorageService();
