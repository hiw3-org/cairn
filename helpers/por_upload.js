// por_upload.js
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
    });
    console.log("✅ SDK initialized");
  }

  async ensurePaymentSetup() {
    console.log("💰 Checking payment setup...");

    try {
      const balance = await this.synapse.payments.balance();
      const balanceFormatted = ethers.formatUnits(balance, 18);
      console.log(`Current USDFC balance: ${balanceFormatted}`);

      const requiredBalance = ethers.parseUnits("2", 18);
      if (balance < requiredBalance) {
        console.log("💳 Depositing USDFC tokens...");
        const depositAmount = ethers.parseUnits("5", 18);
        await this.synapse.payments.deposit(depositAmount);
        console.log("✅ Deposit complete");
      }

      const warmStorageAddress = this.synapse.getWarmStorageAddress();
      const serviceStatus = await this.synapse.payments.serviceApproval(warmStorageAddress);

      if (!serviceStatus.isApproved) {
        console.log("🔐 Approving Warm Storage service...");
        await this.synapse.payments.approveService(
          warmStorageAddress,
          ethers.parseUnits("10", 18),
          ethers.parseUnits("1000", 18),
          7776000n
        );
        console.log("✅ Service approval complete");
      } else {
        console.log("✅ Service already approved");
      }
    } catch (error) {
      console.error("❌ Payment setup failed:", error.message);
      console.log("💡 You may need testnet USDFC tokens. Check the Filecoin Calibration faucet.");
      throw error;
    }
  }

  async createZipBundle(por1Path, por2Path, scriptPath) {
    const timestamp = Date.now();
    const zipPath = path.join(__dirname, `por_bundle_${timestamp}.zip`);

    const filePaths = [
      { src: por1Path, desc: "Phase 1 PoR (Execution)" },
      { src: por2Path, desc: "Phase 2 PoR (Validation)" },
      { src: scriptPath, desc: "Model Script" },
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
        const cleanDesc = fileInfo.desc.replace(/[^a-zA-Z0-9]/g, "_");
        const zipFileName = `${cleanDesc}_${fileName}`;

        archive.file(fileInfo.src, { name: zipFileName });
        console.log(`  📄 Added: ${fileName} → ${zipFileName}`);
      }

      archive.finalize();
    });
  }

  async uploadZipBundle(por1Path, por2Path, scriptPath) {
    try {
      // Create ZIP bundle
      const zipPath = await this.createZipBundle(por1Path, por2Path, scriptPath);

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

    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

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

async function runUpload(por1Path, por2Path, scriptPath) {
  const uploader = new PorUploader();

  try {
    await uploader.initialize();
    await uploader.ensurePaymentSetup();

    console.log("\n📦 Starting ZIP bundle upload...");
    const startTime = Date.now();

    const result = await uploader.uploadZipBundle(por1Path, por2Path, scriptPath);

    const endTime = Date.now();
    const uploadDuration = (endTime - startTime) / 1000;

    console.log("\n🎉 Upload Complete!");
    console.log("===================");
    console.log(`📦 Bundle CID: ${result.bundleCid}`);
    console.log(`📊 Bundle Size: ${result.size} bytes`);
    console.log(`⏱️  Upload Time: ${uploadDuration.toFixed(2)} seconds`);

    console.log("\n💾 Single CID for entire PoR bundle:");
    console.log(`   ${result.bundleCid}`);
    console.log("\n📥 To retrieve: Download this CID to get a ZIP with all files!");
  } catch (error) {
    console.error("\n❌ Upload failed:", error.message);
    process.exit(1);
  }
}

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Run if called directly
main().catch(console.error);
