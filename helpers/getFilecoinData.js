/**
 * This script downloads a ZIP file from Filecoin.
 * It initializes the Synapse SDK, downloads the file, saves it locally (optional), and logs download details.
 * To run the script, provide the file CID as a command line argument or enter it interactively or call the function programmatically.
 * Ensure you have a .env file with your PRIVATE_KEY for authentication.
 *
 * Usage:
 * node getFilecoinData.js <file CID>
 * or
 * node getFilecoinData.js (for interactive mode)
 * or
 * import { runDownload } from './getFilecoinData.js'; (for programmatic use)
 *
 * Environment Setup:
 * Create a .env file with
 * PRIVATE_KEY=0x1234567890abcdef...
 *
 **/
import { Synapse, RPC_URLS } from "@filoz/synapse-sdk";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

export class DataDownloader {
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

  async downloadFile(cid) {
    if (!this.synapse) {
      throw new Error("SDK not initialized. Call initialize() first.");
    }
    console.log(`Downloading CID: ${cid}`);

    const data = await this.synapse.storage.download(cid);

    return {
      data: data,
      cid: cid,
      filename: `file_${cid.slice(0, 8)}.zip`,
      contentType: "application/zip",
    };
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
async function runDownload(cid, outputPath = null) {
  const downloader = new DataDownloader();

  try {
    await downloader.initialize();

    const startTime = Date.now();
    const data = await downloader.downloadFile(cid);
    // Create output filename if not provided
    if (!outputPath) {
      outputPath = `downloaded_${cid.slice(0, 8)}.zip`;
    }

    fs.writeFileSync(outputPath, data.data);
    console.log(`File downloaded to: ${outputPath}`);

    const endTime = Date.now();
    const downloadDuration = (endTime - startTime) / 1000;

    console.log("\n🎉 Download Complete!");
    console.log("===================");
    console.log(`📦 Downloaded File: ${data.filename}`);
    console.log(`⏱️  Download Time: ${downloadDuration.toFixed(2)} seconds`);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Download failed:", error.message);
    process.exit(1);
  }
}

// CLI handling
async function main() {
  console.log("Cairn Filecoin Data Downloader");
  console.log("==============================");

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage Options:

1. Command line arguments:
   node getFilecoinData.js <file CID>

2. Interactive mode (no arguments):
   node getFilecoinData.js

Examples:
   node getFilecoinData.js bafkzcibd2yiqr75gfp657yak65bf42qesiy5vfmqjbl457qwrb7tfghij2hy4li3
   node getFilecoinData.js  # Interactive mode

Features:
   - Download files from Filecoin using their CID
   - Logs download time and file path

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
      const data_cid = await question("Filecoin CID: ");

      rl.close();
      await runDownload(data_cid.trim());
    } catch (error) {
      rl.close();
      throw error;
    }
    return;
  }

  if (args.length !== 1) {
    console.error("❌ Please provide exactly one argument: the file CID.");
    process.exit(1);
  }

  await runDownload(args[0]);
}

// Load environment variables
dotenv.config();

// Run if called directly
const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  main().catch(console.error);
}
