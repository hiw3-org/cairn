/**
 * This script uploads a Hugging Face repository to Filecoin via the Synapse SDK.
 * It initializes the Synapse SDK, downloads the repository from hf, creates a ZIP bundle, estimates storage cost,
 * ensures payment setup, uploads the ZIP to Filecoin, logs upload details, and cleans up local files.
 * Supports both command-line and interactive modes for specifying the Hugging Face repo URL.
 * Requires a .env file with your PRIVATE_KEY for authentication.
 *
 * Usage:
 * node project_upload.js <hugging face repo url>
 * or
 * node project_upload.js (for interactive mode)
 * or
 * import { runUpload } from './projectUpload.js'; (for programmatic use)
 *
 * Features:
 * - Creates a single ZIP containing all files in the repo
 * - One upload = One CID for the entire repo
 * - Easy to download and extract later
 * - Cleans up local files after upload
 *
 * Environment Setup:
 * Create a .env file with
 * PRIVATE_KEY=0x1234567890abcdef...
 *
 */
import { Synapse, RPC_URLS } from "@filoz/synapse-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ProjectUploader {
  constructor() {
    this.synapse = null;
  }

  async initialize() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error("❌ PRIVATE_KEY not found in environment variables");
      console.log("Please create a .env file with your private key:");
      console.log("PRIVATE_KEY=0x1234567890abcdef...");
      process.exit(1);
    }

    console.log("Initializing Synapse SDK...");
    try {
      const rpcURL = process.env.RPC_URL || RPC_URLS.calibration.http;
      this.synapse = await Synapse.create({
        privateKey: privateKey,
        rpcURL: rpcURL,
      });
      this.context = await this.synapse.storage.createContext();
    } catch (error) {
      console.error("❌ Failed to initialize Synapse SDK:", error);
      process.exit(1);
    }

    console.log("✅ SDK initialized");
  }

  /**
   * Estimates the storage cost for a given data size.
   *
   * @async
   * @param {number} dataSize - The size of the data to be stored, in bytes.
   * @returns {Promise<number>} The estimated storage cost and preflight information.
   * @throws {Error} If the SDK is not initialized.
   */
  async getEstimatedStorageCost() {
    if (!this.synapse) {
      throw new Error("SDK not initialized. Call initialize() first.");
    }

    const storageCostInfo = await this.synapse.storage.getStorageInfo();
    console.log(`Estimated storage cost: ${storageCostInfo.estimatedCost}`);
    return storageCostInfo;
  }

  /**
   * Ensures that the payment setup for the Synapse service is complete.
   *
   * This method performs the following steps:
   * 1. Checks the current USDFC token balance.
   * 2. Deposits additional USDFC tokens if the balance is below the required threshold.
   * 3. Checks if the Warm Storage service is approved.
   * 4. Approves the Warm Storage service if not already approved.
   *
   * If any step fails, logs an error message and suggests obtaining testnet USDFC tokens.
   *
   * @async
   * @throws {Error} If payment setup fails at any step.
   */
  async ensurePaymentSetup(dataSize = 0, daysOfStorage = 90) {
    if (!this.synapse) {
      throw new Error("SDK not initialized. Call initialize() first.");
    }
    if (dataSize <= 0) {
      throw new Error("Data size must be greater than 0 bytes.");
    }

    console.log("💰 Checking payment setup...");
    try {
      // Get cost estimation
      const storageInfo = await this.synapse.storage.getStorageInfo();
      const pricing = storageInfo.pricing.noCDN;

      const dataSizeTiB =
        (BigInt(dataSize) * 1000000000000000000n) / 1024n ** 4n;
      const perDay =
        (pricing.perTiBPerDay * dataSizeTiB) / 1000000000000000000n;

      console.log(
        `📊 Storage cost: ${ethers.formatUnits(perDay, 18)} USDFC per day`
      );

      // Calculate total lockup needed for the storage period
      const totalLockupCost = perDay * BigInt(daysOfStorage);

      // Add buffer (20% extra for safety)
      const lockupWithBuffer = (totalLockupCost * 120n) / 100n;
      const rateAllowance = perDay * 10n; // 10 days worth as rate allowance

      console.log(
        `🔒 Lockup needed for ${daysOfStorage} days: ${ethers.formatUnits(
          lockupWithBuffer,
          18
        )} USDFC`
      );

      const balance = await this.synapse.payments.balance();
      const balanceFormatted = ethers.formatUnits(balance, 18);
      console.log(`Current USDFC balance: ${balanceFormatted}`);

      // Deposit more if needed
      if (balance < lockupWithBuffer) {
        // Check allowance
        const paymentsAddress = this.synapse.getPaymentsAddress();
        const currentAllowance = await this.synapse.payments.allowance(
          paymentsAddress
        );
        if (currentAllowance < lockupWithBuffer) {
          const approveTx = await this.synapse.payments.approve(
            paymentsAddress,
            lockupWithBuffer
          );
          await approveTx.wait();
          console.log(
            `✅ Approved ${ethers.formatUnits(approveTx.value, 18)} USDFC`
          );
        }

        // Deposit needed amount
        const needed = lockupWithBuffer - balance;
        const depositAmount = needed;
        console.log("💳 Depositing USDFC tokens...");
        await this.synapse.payments.deposit(depositAmount);
        console.log("✅ Deposit complete");
      }

      const warmStorageAddress = await this.synapse.getWarmStorageAddress();
      if (!warmStorageAddress) {
        throw new Error("Warm Storage service address not found");
      }
      const serviceStatus = await this.synapse.payments.serviceApproval(
        warmStorageAddress
      );

      // Approve service if not already approved or if allowances are insufficient
      if (
        !serviceStatus.isApproved ||
        serviceStatus.lockupAllowance < lockupWithBuffer ||
        serviceStatus.rateAllowance < rateAllowance
      ) {
        console.log("🔐 Approving Warm Storage service...");
        await this.synapse.payments.approveService(
          warmStorageAddress, // Service provider address
          rateAllowance, // Rate allowance
          lockupWithBuffer, // Lockup allowance
          BigInt(daysOfStorage * 24 * 60 * 60) // Lockup period in seconds
        );
        console.log("✅ Service approval complete");
      } else {
        console.log("✅ Service already approved");
      }
    } catch (error) {
      console.error("❌ Payment setup failed:", error.message);
      throw error;
    }
  }

  /**
   * Creates a ZIP archive containing the specified files and returns the path to the created ZIP file.
   *
   * @async
   * @param {string} por1Path - Path to the first file to include in the ZIP.
   * @param {string} por2Path - Path to the second file to include in the ZIP.
   * @param {string} scriptPath - Path to the script file to include in the ZIP.
   * @returns {Promise<string>} Resolves with the path to the created ZIP file.
   * @throws {Error} If any of the specified files do not exist or if an error occurs during ZIP creation.
   */
  async createZipFile(repoPath) {
    const timestamp = Date.now();
    const repoName = path.basename(repoPath);
    const files = fs.readdirSync(repoPath);
    const zipPath = path.join(__dirname, `${repoName}_${timestamp}.zip`);

    console.log("📦 Creating ZIP bundle...");

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        console.log(`✅ ZIP created: ${archive.pointer()} bytes`);
        resolve(zipPath);
      });

      archive.on("error", (err) => reject(err));
      archive.pipe(output);

      files.forEach((file) => {
        const filePath = path.join(repoPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
          archive.file(filePath, { name: file });
          console.log(`  📄 Added: ${file}`);
        } else if (stat.isDirectory()) {
          archive.directory(filePath, file);
          console.log(`  📁 Added directory: ${file}`);
        }
      });

      archive.finalize();
    });
  }
  /**
   * Creates a ZIP bundle from the provided file paths, uploads it to Filecoin via Synapse storage,
   * and returns the upload result including the bundle CID, size, and compression ratio.
   *
   * @async
   * @param {string} por1Path - Path to the first POR file.
   * @param {string} por2Path - Path to the second POR file.
   * @param {string} scriptPath - Path to the script file to include in the bundle.
   * @returns {Promise<Object>} Resolves with an object containing:
   *   - {string} bundleCid - The CID of the uploaded bundle.
   *   - {number} size - The size of the uploaded bundle in bytes.
   *   - {string} compressionRatio - The compression ratio as a percentage string.
   * @throws Will throw an error if ZIP creation or upload fails.
   */
  async uploadZipBundle(repoPath) {
    try {
      // Create ZIP bundle
      const zipPath = await this.createZipFile(repoPath);

      // Upload the ZIP
      console.log("📤 Uploading ZIP bundle to Filecoin...");
      const zipData = fs.readFileSync(zipPath);
      const zipSize = zipData.length;

      const uploadResult = await this.synapse.storage.upload(zipData);

      // Clean up temporary ZIP
      fs.unlinkSync(zipPath);

      console.log("✅ ZIP bundle uploaded successfully!");

      return {
        status: "success",
        bundleCid: uploadResult.pieceCid,
        size: uploadResult.size,
        compressionRatio: ((1 - uploadResult.size / zipSize) * 100).toFixed(1),
      };
    } catch (error) {
      console.error("❌ Failed to create or upload ZIP bundle:", error.message);
      throw error;
    }
  }

  /**
   * Downloads a Hugging Face repository by cloning it into the specified directory.
   * If the repository already exists locally, returns its path and size.
   * After cloning, removes the `.git` folder to save space and returns the path and size of the cloned repo.
   *
   * @async
   * @param {string} repoUrl - The URL of the Hugging Face repository to clone.
   * @param {string} [destDir="./models"] - The destination directory where the repository will be cloned.
   * @returns {Promise<{ path: string, size: number }>} Resolves with the local path and size (in bytes) of the repository.
   */
  async dlHuggingFaceRepo(repoUrl, destDir = "./models") {
    const { exec } = await import("child_process");
    return new Promise((resolve, reject) => {
      console.log(`\n🔽 Cloning Hugging Face repo: ${repoUrl}`);
      const repoName = repoUrl.split("/").pop();
      const repoPath = `${destDir}/${repoName}`; // Changed variable name

      // Check if folder already exists
      if (fs.existsSync(repoPath)) {
        console.log(`📁 Repository already exists: ${repoPath}`);
        const size = this.getDirectorySize(repoPath);
        console.log(`📦 Existing repo size: ${size} bytes`);
        resolve({ path: repoPath, size }); // Use resolve() directly, not return Promise.resolve()
        return;
      }

      exec(
        `git clone ${repoUrl} ${destDir}/${repoName}`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Error cloning repo: ${error.message}`);
            return reject(error);
          }
          // Delete .git folder to save space
          const gitFolderPath = path.join(repoPath, ".git"); // Now using path module correctly
          if (fs.existsSync(gitFolderPath)) {
            fs.rmSync(gitFolderPath, { recursive: true, force: true });
            console.log(`🗑️ Removed .git folder`);
          }
          // Get size of cloned repo
          const size = this.getDirectorySize(repoPath); // Updated variable name
          console.log(`✅ Cloned repo successfully: ${stdout}`);
          console.log(`📦 Cloned repo size: ${size} bytes`);
          resolve({ path: repoPath, size }); // Updated variable name
        }
      );
    });
  }

  /**
   * Calculates the total size (in bytes) of all files within a directory, including its subdirectories.
   *
   * @param {string} dirPath - The path to the directory whose size should be calculated.
   * @returns {number} The total size of all files in the directory and its subdirectories, in bytes.
   */
  getDirectorySize(dirPath) {
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
   * Creates a snapshot of the repository by listing all files in the specified directory.
   *
   * @param {string} repoPath - The path to the repository directory.
   * @returns {string} A semicolon-separated string of file names in the directory.
   */
  createRepoSnapshot(repoPath) {
    // Get all files in the models directory
    const files = fs
      .readdirSync(repoPath)
      .map((file) => path.basename(file))
      .join("; ");

    return files;
  }

  /**
   * Deletes the repository at the specified path.
   * If the path exists, it removes the directory and its contents recursively.
   * Logs the result and returns true if deletion was successful, false otherwise.
   *
   * @param {string} repoPath - The file system path to the repository to delete.
   * @returns {boolean} True if the repository was deleted, false if the path does not exist.
   */
  deleteRepo(repoPath) {
    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
      console.log(`🗑️ Deleted repo at ${repoPath}`);
      return true;
    } else {
      console.log(`Repo path ${repoPath} does not exist.`);
      return false;
    }
  }
}

/**
 * Uploads a Hugging Face repository to a remote storage, handling initialization, payment setup,
 * downloading, uploading, snapshot creation, and cleanup.
 *
 * @async
 * @function runUpload
 * @param {string} repoUrl - The URL of the Hugging Face repository to upload.
 * @param {number} [dataDurationDays=90] - The number of days to retain the uploaded data (default is 90).
 * @returns {Promise<void>} Resolves when the upload process is complete.
 * @throws Will log and exit the process if any step fails.
 */
async function runUpload(repoUrl, dataDurationDays = 90) {
  const uploader = new ProjectUploader();

  try {
    // Initialize SDK
    await uploader.initialize();

    console.log("\n🔽 Downloading Hugging Face repo...");
    const repoInfo = await uploader.dlHuggingFaceRepo(repoUrl);
    const repoName = repoUrl.split("/").pop();
    const repoPath = path.join("./models", repoName);

    // Ensure payment setup
    await uploader.ensurePaymentSetup(repoInfo.size, dataDurationDays);

    const startTime = Date.now();
    const result = await uploader.uploadZipBundle(repoPath);
    const endTime = Date.now();
    const uploadDuration = (endTime - startTime) / 1000;

    console.log("\n🎉 Upload Complete!");
    console.log("===================");
    console.log(`📦 File CID: ${result.bundleCid}`);
    console.log(`📊 File Size: ${result.size} bytes`);
    console.log(`⏱️ Upload Time: ${uploadDuration.toFixed(2)} seconds`);

    const repoSnapShot = uploader.createRepoSnapshot(repoPath);
    console.log(`\n🗂️  Repo Snapshot: ${repoSnapShot}`);

    const deleteRepo = uploader.deleteRepo(repoPath);
    if (deleteRepo) {
      console.log("🧹 Cleaned up local files.");
    } else {
      console.log("⚠️ Local files not found for cleanup.");
    }

    return repoSnapShot;
  } catch (error) {
    console.error("\n❌ Upload failed:", error.message);
    process.exit(1);
  }
}

/**
 * Main entry point for the Cairn PoR ZIP Bundle Uploader.
 *
 * - Displays usage instructions if no arguments are provided.
 * - Supports both command-line and interactive modes for uploading a ZIP bundle to a Hugging Face repo.
 * - Requires a Hugging Face repo URL as an argument or via interactive prompt.
 * - Ensures only one argument (the repo URL) is accepted in command-line mode.
 * - Reads environment variables from a `.env` file for authentication.
 *
 * @async
 * @function main
 * @returns {Promise<void>} Resolves when the upload process is complete.
 */
async function main() {
  console.log("Cairn PoR ZIP Bundle Uploader");
  console.log("==============================");

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage Options:

1. Command line arguments:
   node project_upload.js <hugging face repo url>

2. Interactive mode (no arguments):
   node project_upload.js

Examples:
   node project_upload.js https://huggingface.co/username/repo_name
   node project_upload.js  # Interactive mode

Features:
   - Creates a single ZIP containing all files
   - One upload = One CID for the entire repo
   - Easy to download and extract later

Environment Setup:
   Create a .env file with: PRIVATE_KEY=0x1234567890abcdef...
    `);

    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    try {
      console.log("\n📝 Interactive Mode - Enter file paths:");
      const hugging_face_repo_url = await question("Hugging Face repo URL: ");

      rl.close();
      await runUpload(hugging_face_repo_url.trim());
    } catch (error) {
      rl.close();
      throw error;
    }
    return;
  }

  if (args.length !== 1) {
    console.error("❌ Please provide exactly 1 Hugging Face repo URL");
    process.exit(1);
  }

  await runUpload(args[0]);
}

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// At the bottom of your file, replace the current check with:
const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  main().catch(console.error);
}
