/**
 * This script uploads Proof of Reproducibility (PoR) files to Filecoin storage via the Synapse SDK.
 * It creates ZIP bundles containing phase 1 PoR files, phase 2 PoR files, and model scripts,
 * handles USDFC payments, uploads to Filecoin, and returns a single CID for the entire bundle.
 * Supports both command-line and interactive modes for specifying file paths.
 * Requires a .env file with your PRIVATE_KEY for authentication.
 *
 * Usage:
 * node porUpload.js <phase1_file> <phase2_file> <script_file>
 * or
 * node porUpload.js (for interactive mode)
 * or
 * import { PorUploader, runUpload } from './porUpload.js'; (for programmatic use)
 *
 * Features:
 * - Creates a single ZIP containing all PoR files
 * - One upload = One CID for the entire reproducibility bundle
 * - Handles USDFC token deposits and service approvals
 * - Easy to download and extract later for verification
 * - Cleans up temporary files after upload
 *
 * Environment Setup:
 * Create a .env file with
 * PRIVATE_KEY=0x1234567890abcdef...
 *
 **/
import { Synapse, RPC_URLS } from "@filoz/synapse-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PorUploader {
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
    const rpcURL = process.env.RPC_URL || RPC_URLS.calibration.http;
    this.synapse = await Synapse.create({
      privateKey: privateKey,
      rpcURL: rpcURL,
      withCDN: true,
    });
    console.log("✅ SDK initialized");
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

      const BYTES_PER_TIB = 1024n ** 4n;
      const PRECISION = 1000000000000000000n; // 1e18 for 18 decimal places
      const dataSizeTiB = (BigInt(dataSize) * PRECISION) / BYTES_PER_TIB;
      const perDay = (pricing.perTiBPerDay * dataSizeTiB) / PRECISION;

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

      const warmStorageAddress = this.synapse.getWarmStorageAddress();
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
  async createZipBundle(por1Path, por2Path, scriptPath) {
    const timestamp = Date.now();
    const zipPath = path.join(__dirname, `por_bundle_${timestamp}.zip`);

    const filePaths = [
      { src: por1Path },
      { src: por2Path },
      { src: scriptPath },
    ];

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

      // Add files to ZIP
      for (const fileInfo of filePaths) {
        if (!fs.existsSync(fileInfo.src)) {
          reject(new Error(`File not found: ${fileInfo.src}`));
          return;
        }

        const fileName = path.basename(fileInfo.src);
        const zipFileName = fileName;

        archive.file(fileInfo.src, { name: zipFileName });
        console.log(`  📄 Added: ${fileName} → ${zipFileName}`);
      }

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
  async uploadZipBundle(por1Path, por2Path, scriptPath) {
    try {
      // Create ZIP bundle
      const zipPath = await this.createZipBundle(
        por1Path,
        por2Path,
        scriptPath
      );

      // Upload the ZIP
      console.log("📤 Uploading ZIP bundle to Filecoin...");
      const zipData = fs.readFileSync(zipPath);
      const zipSize = zipData.length;

      console.log(`📦 Uploading bundle (${zipSize} bytes)...`);
      const uploadResult = await this.synapse.storage.upload(zipData);

      // Clean up temporary ZIP
      fs.unlinkSync(zipPath);

      console.log("✅ ZIP bundle uploaded successfully!");

      return {
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
   * Calculates the total size of the files that will be included in the ZIP bundle
   * @param {string} por1Path - Path to phase 1 PoR file
   * @param {string} por2Path - Path to phase 2 PoR file
   * @param {string} scriptPath - Path to script file
   * @returns {number} Total size in bytes
   */
  calculateBundleSize(por1Path, por2Path, scriptPath) {
    const filePaths = [por1Path, por2Path, scriptPath];
    let totalSize = 0;

    console.log("📊 Calculating bundle size...");

    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      const fileSize = fs.statSync(filePath).size;
      totalSize += fileSize;
      console.log(`  📄 ${path.basename(filePath)}: ${fileSize} bytes`);
    }

    const estimatedZipSize = Math.ceil(totalSize * 0.8);
    console.log(`📦 Estimated ZIP size: ${estimatedZipSize} bytes`);

    return estimatedZipSize;
  }
}

/**
 * Uploads a ZIP bundle containing the specified PoR files and script, and logs upload details.
 * This function initializes the uploader, ensures payment setup, creates the ZIP bundle,
 * and returns the upload result including the bundle CID, size, and compression ratio.
 *
 * @async
 * @function runUpload
 * @param {string} por1Path - Path to the first PoR file.
 * @param {string} por2Path - Path to the second PoR file.
 * @param {string} scriptPath - Path to the script file to include in the bundle.
 * @returns {Promise<void>} Resolves when the upload process is complete.
 */
async function runUpload(por1Path, por2Path, scriptPath, daysOfStorage = 90) {
  const uploader = new PorUploader();

  try {
    await uploader.initialize();

    const bundleSize = uploader.calculateBundleSize(
      por1Path,
      por2Path,
      scriptPath
    );

    await uploader.ensurePaymentSetup(bundleSize, daysOfStorage);

    console.log("\n📦 Starting ZIP bundle upload...");
    const startTime = Date.now();

    const result = await uploader.uploadZipBundle(
      por1Path,
      por2Path,
      scriptPath
    );

    const endTime = Date.now();
    const uploadDuration = (endTime - startTime) / 1000;

    console.log("\n🎉 Upload Complete!");
    console.log("===================");
    console.log(`📦 Bundle CID: ${result.bundleCid}`);
    console.log(`📊 Bundle Size: ${result.size} bytes`);
    console.log(`⏱️  Upload Time: ${uploadDuration.toFixed(2)} seconds`);

    console.log("\n💾 Single CID for entire PoR bundle:");
    console.log(`   ${result.bundleCid}`);
    console.log(
      "\n📥 To retrieve: Download this CID to get a ZIP with all files!"
    );
  } catch (error) {
    console.error("\n❌ Upload failed:", error.message);
    process.exit(1);
  }
}

// CLI handling
async function main() {
  console.log("Cairn PoR ZIP Bundle Uploader");
  console.log("==============================");

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage Options:

1. Command line arguments:
   node por_upload.js <phase1_file> <phase2_file> <script_file>

2. Interactive mode (no arguments):
   node por_upload.js

Examples:
   node por_upload.js ./PoR_phase_1_project.json ./PoR_phase_2_project.json ./model_script.py
   node por_upload.js  # Interactive mode

Features:
   - Creates a single ZIP containing all files + manifest
   - One upload = One CID for the entire bundle
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
      const por1Path = await question("Phase 1 PoR file path: ");
      const por2Path = await question("Phase 2 PoR file path: ");
      const scriptPath = await question("Model script file path: ");

      rl.close();
      await runUpload(por1Path.trim(), por2Path.trim(), scriptPath.trim());
    } catch (error) {
      rl.close();
      throw error;
    }
    return;
  }

  if (args.length !== 3) {
    console.error("❌ Please provide exactly 3 file paths");
    process.exit(1);
  }

  await runUpload(args[0], args[1], args[2]);
}

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Run if called directly
main().catch(console.error);
