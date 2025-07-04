#!/usr/bin/env node
import 'dotenv/config';
import { ethers } from 'ethers';

async function main() {
  // Load environment variables
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL;
  const hypercertAddress = process.env.HYPERCERT_ADDRESS;

  if (!privateKey || !rpcUrl || !hypercertAddress) {
    throw new Error("Please set PRIVATE_KEY, RPC_URL, and HYPERCERT_ADDRESS in your .env file");
  }

  // Connect to provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Hypercert contract ABI (only mintClaim and ClaimStored event)
  const hypercertAbi = [
    "function mintClaim(address account, uint256 units, string uri, uint8 restrictions) external",
    "event ClaimStored(uint256 indexed claimID, string uri, uint256 units)"
  ];

  // Connect to Hypercert contract
  const hypercert = new ethers.Contract(hypercertAddress, hypercertAbi, wallet);

  // Parameters for minting - adjust as needed
  const to = wallet.address;
  const units = 1000;
  const uri = "ipfs://QmExampleProjectURI";  // Replace with your actual URI
  const restrictions = 0;  // Replace with your actual restrictions enum value

  console.log("Sending mintClaim transaction...");
  const tx = await hypercert.mintClaim(to, units, uri, restrictions);
  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("Transaction mined in block", receipt.blockNumber);

  // Parse ClaimStored event from logs
  const iface = new ethers.Interface(hypercertAbi);
  const claimIds = [];

  for (const log of receipt.logs) {
    try {
      const parsedLog = iface.parseLog(log);
      if (parsedLog.name === "ClaimStored") {
        const claimID = parsedLog.args.claimID;
        console.log(`ClaimStored event found - claimID: ${claimID.toString()}, uri: ${parsedLog.args.uri}, units: ${parsedLog.args.units.toString()}`);
        claimIds.push(claimID.toString());
      }
    } catch {
      // Ignore logs that are not ClaimStored events
    }
  }

  if (claimIds.length === 0) {
    console.log("No ClaimStored events found in transaction logs.");
  } else {
    console.log("Minted token IDs:", claimIds);

    const incrementedIds = claimIds.map(id => BigInt(id) + BigInt(1));
    console.log("Minted token IDs incremented by 1:", incrementedIds.map(id => id.toString()));
  }

  return claimIds;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
