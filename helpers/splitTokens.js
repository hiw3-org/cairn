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
  const hypercertAbi = [
    "function splitFraction(address to, uint256 tokenID, uint256[] memory _values) external",
    "event ClaimStored(uint256 indexed claimID, string uri, uint256 units)",
    "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
    "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
  ];

  // Connect to Hypercert contract
  const hypercert = new ethers.Contract(hypercertAddress, hypercertAbi, wallet);

  // Parameters for minting - adjust as needed
  const to = "0x168030E5694dCC51C15116994F0A98C0Bd03c5F1";
  const tokenID = "324289095675654355680596000882475105517569";
  const units = [700, 300];

  console.log("Splitting fractions of hypercert.");
  const tx = await hypercert.splitFraction(to, tokenID, units);
  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("Transaction mined in block", receipt.blockNumber);

  const iface = new ethers.Interface(hypercertAbi);

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      console.log("Parsed log:", parsed);
      if (parsed.name === "TransferSingle") {
        console.log(
          `TransferSingle: from ${parsed.args.from}, to ${
            parsed.args.to
          }, token ID: ${parsed.args.id.toString()}, units: ${parsed.args.value.toString()}`
        );
      }

      if (parsed.name === "TransferBatch") {
        const ids = parsed.args.ids.map((id) => id.toString());
        const values = parsed.args.values.map((v) => v.toString());
        console.log(
          `TransferBatch: from ${parsed.args.from}, to ${
            parsed.args.to
          }, token IDs: [${ids.join(", ")}], units: [${values.join(", ")}]`
        );
      }
    } catch {
      // Skip non-matching logs
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
