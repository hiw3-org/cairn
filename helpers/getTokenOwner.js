#!/usr/bin/env node
import "dotenv/config";
import { ethers } from "ethers";

async function main() {
  // Load environment variables
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL;
  const hypercertAddress = process.env.HYPERCERT_ADDRESS;

  if (!privateKey || !rpcUrl || !hypercertAddress) {
    throw new Error(
      "Please set PRIVATE_KEY, RPC_URL, and HYPERCERT_ADDRESS in your .env file"
    );
  }

  // Connect to provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Hypercert contract ABI (only mintClaim and ClaimStored event)
  const hypercertAbi = ["function ownerOf(uint256 tokenID) external"];

  // Connect to Hypercert contract
  const hypercert = new ethers.Contract(hypercertAddress, hypercertAbi, wallet);

  // Parameters for minting - adjust as needed
  const owner = "0x168030E5694dCC51C15116994F0A98C0Bd03c5F1";

  console.log("Splitting fractions of hypercert.");
  const tokenID = await hypercert.ownerOf(owner);
  console.log("Token id:", tokenID);

  return tokenID;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
