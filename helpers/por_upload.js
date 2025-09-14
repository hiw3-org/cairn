// por_upload.js
import { Synapse, RPC_URLS } from "@filoz/synapse-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PorUploader {
  constructor() {
    this.synapse = null;
  }

  async initialize() {
    // Check for private key in environment
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error("❌ PRIVATE_KEY not found in environment variables");
      console.log("Please create a .env file with your private key:");
      console.log("PRIVATE_KEY=0x1234567890abcdef...");
      process.exit(1);
    }

    console.log("Initializing Synapse SDK...");
    // Use RPC_URL from environment if provided, otherwise default to calibration
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
      // Check current balance
      const balance = await this.synapse.payments.balance();
      const balanceFormatted = ethers.formatUnits(balance, 18);
      console.log(`Current USDFC balance: ${balanceFormatted}`);

      // Check if we need to deposit
      const requiredBalance = ethers.parseUnits("2", 18); // 5 USDFC minimum
      if (balance < requiredBalance) {
        console.log("💳 Depositing USDFC tokens...");
        const depositAmount = ethers.parseUnits("5", 18); // 5 USDFC
        await this.synapse.payments.deposit(depositAmount);
        console.log("✅ Deposit complete");
      }

      // Check service approval
      const warmStorageAddress = this.synapse.getWarmStorageAddress();
      const serviceStatus = await this.synapse.payments.serviceApproval(warmStorageAddress);

      if (!serviceStatus.isApproved) {
        console.log("🔐 Approving Warm Storage service...");
        await this.synapse.payments.approveService(
          warmStorageAddress,
          ethers.parseUnits("10", 18), // Rate allowance: 10 USDFC per epoch
          ethers.parseUnits("1000", 18), // Lockup allowance: 1000 USDFC total
          7776000n // Max lockup period: 90 days
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

  async uploadFile(filePath, description) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileData = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      const fileSize = fileData.length;

      console.log(`📤 Uploading ${fileName} (${fileSize} bytes)...`);

      const uploadResult = await this.synapse.storage.upload(fileData);

      console.log(`✅ ${description} uploaded!`);
      console.log(`   PieceCID: ${uploadResult.pieceCid}`);

      return {
        fileName,
        filePath,
        pieceCid: uploadResult.pieceCid,
        size: uploadResult.size,
        description,
      };
    } catch (error) {
      console.error(`❌ Failed to upload ${description}:`, error.message);
      throw error;
    }
  }

  async uploadBundle(por1Path, por2Path, scriptPath) {
    const results = [];

    // Upload each file
    const por1Result = await this.uploadFile(por1Path, "Phase 1 PoR (Execution)");
    results.push(por1Result);

    const por2Result = await this.uploadFile(por2Path, "Phase 2 PoR (Validation)");
    results.push(por2Result);

    const scriptResult = await this.uploadFile(scriptPath, "Model Script");
    results.push(scriptResult);

    // Create and upload manifest
    const manifest = {
      bundle_type: "ai_reproducibility_proof",
      created_at: new Date().toISOString(),
      files: {
        phase1_execution: por1Result,
        phase2_validation: por2Result,
        model_script: scriptResult,
      },
      verification_info: {
        download_instructions: "Use PieceCID with Filecoin retrieval tools",
        verification_steps: [
          "Download files using their PieceCIDs",
          "Verify cryptographic signatures in PoR files",
          "Compare script hash with execution proof",
        ],
      },
    };

    const manifestPath = path.join(__dirname, `manifest_${Date.now()}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log("📋 Uploading bundle manifest...");
    const manifestResult = await this.uploadFile(manifestPath, "Bundle Manifest");

    // Clean up temporary manifest
    fs.unlinkSync(manifestPath);

    return {
      manifest: manifestResult,
      files: results,
      summary: {
        total_files: results.length + 1,
        bundle_cid: manifestResult.pieceCid,
      },
    };
  }
}

// CLI handling
async function main() {
  console.log("Cairn PoR Bundle Uploader");
  console.log("==========================================");

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage Options:

1. Command line arguments:
   node upload_por_bundle.js <phase1_file> <phase2_file> <script_file>

2. Interactive mode (no arguments):
   node upload_por_bundle.js

Examples:
   node upload_por_bundle.js ./PoR_phase_1_project.json ./PoR_phase_2_project.json ./model_script.py
   node upload_por_bundle.js  # Interactive mode

Environment Setup:
   Create a .env file with: PRIVATE_KEY=0x1234567890abcdef...
        `);

    // Interactive mode
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
    // Initialize SDK
    await uploader.initialize();

    // Setup payments (one-time setup)
    await uploader.ensurePaymentSetup();

    // Upload bundle
    console.log("\n📦 Starting bundle upload...");
    const result = await uploader.uploadBundle(por1Path, por2Path, scriptPath);

    console.log("\n🎉 Upload Complete!");
    console.log("===================");
    console.log(`Bundle Manifest CID: ${result.manifest.pieceCid}`);
    console.log("\nFile Details:");
    result.files.forEach((file) => {
      console.log(`  ${file.description}: ${file.pieceCid}`);
    });
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
