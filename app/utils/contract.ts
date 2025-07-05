import { ethers } from "ethers";
import Cairn from "../abi/Cairn.json";

// Replace with your deployed address on the fork
const CONTRACT_ADDRESS = "0xe5C345683E892416a0B7674651AA5f57ffF820da";

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    Cairn.abi, // some ABIs are exported under `default` or `abi`
    signerOrProvider
  );
}
