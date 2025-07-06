import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers, JsonRpcProvider } from "ethers";
import CairnAbi from "../abi/Cairn.json";
import HypercertAbi from "../abi/IHypercertToken.json";
import { claim } from "@web3-storage/w3up-client/capability/access";
import { sign } from "crypto";

const CONTRACT_ADDRESS = "0xdbe926f96e2250d7C4901f118225566Dc654B969";
const HYPERCERT_ADDRESS = "0x822f17a9a5eecfd66dbaff7946a8071c265d1d07";
const USDC_ADDRESS = "0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0";
const RPC_URL = "https://rpc.ankr.com/filecoin_testnet";

interface ContractContextType {
  cairnContract: ethers.Contract | null;
  hypercertContract: ethers.Contract | null;
  signer: ethers.JsonRpcSigner | null;
  getAllProjects: (start: number, count: number) => Promise<any[]>;
  initWithWallet: (address: string) => Promise<void>;
  mintHypercert: (
    units: number,
    uri: string,
    restrictions?: number
  ) => Promise<bigint | null>;
  registerProjectCairn: (
    projectURI: string,
    tokenID: bigint,
    unitPrice: bigint
  ) => Promise<void>;
  approveHypercertTransfer: () => Promise<boolean>;
  addOutput: (projectURI: string, outputsURI: string) => Promise<void>;
  getProof: (proofCID: string) => Promise<any>;
  getUserPoRCount: (userAddress: string) => Promise<number>;
  recordPoR: (projectCID: string, proofCID: string) => Promise<any>;
  isProofValid: (proofCID: string) => Promise<boolean>;
  contractDisputeProof: (proofCID: string, disputeCID: string) => Promise<void>;
  fundProject: (amount: bigint, projectId: string) => Promise<any>;
  approveUSDCTransfer: (amount: bigint) => Promise<boolean>;
  setProjectImpact: (projectId: string, impact: number) => Promise<void>;
  getTokenOwner: (tokenId: bigint) => Promise<string | null>;
  getTokenUnits: (tokenId: bigint) => Promise<number | null>;
}

const ContractContext = createContext<ContractContextType | undefined>(
  undefined
);

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cairnContract, setCairnContract] = useState<ethers.Contract | null>(
    null
  );
  const [hypercertContract, setHypercertContract] =
    useState<ethers.Contract | null>(null);

  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const staticProvider = new ethers.JsonRpcProvider(RPC_URL);
  const readOnlyCairn = new ethers.Contract(
    CONTRACT_ADDRESS,
    CairnAbi.abi,
    staticProvider
  );
  const readOnlyHypercert = new ethers.Contract(
    HYPERCERT_ADDRESS,
    HypercertAbi.abi,
    staticProvider
  );

  const initWithWallet = async (address: string) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner(address);
    setSigner(signer);
    console.log("Signer initialized:", signer);

    const cairn = new ethers.Contract(CONTRACT_ADDRESS, CairnAbi.abi, signer);
    setCairnContract(cairn);
    console.log("Cairn contract initialized:", cairn);

    const hypercert = new ethers.Contract(
      HYPERCERT_ADDRESS,
      HypercertAbi.abi,
      signer
    );
    setHypercertContract(hypercert);
    console.log("Hypercert contract initialized:", hypercert);
  };

  const parseProjectFromContract = (p: any) => ({
    creator: p[0],
    typeID: BigInt(p[1]).toString(), // or Number(...) if safe
    tokenIDs: p[2].map((t: any) => BigInt(t).toString()),
    projectURI: p[3],
    outputsURI: p[4],
    proofs: p[5], // string[]
    impact: Number(p[6]), // assuming Impact is an enum
    funder: p[7],
    fundingGoal: BigInt(p[8]).toString(),
  });

  useEffect(() => {
    const provider = new JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CairnAbi.abi,
      provider
    );
    setCairnContract(contract);
    console.log("Cairn contract initialized:", contract);
  }, []);

  const getAllProjects = async (start: number, count: number) => {
    if (!cairnContract) return [];
    try {
      console.log("Fetching projects from contract...");
      const projects = await readOnlyCairn.getAllProjects(start, count);
      const parsedProjects = projects.map(parseProjectFromContract);
      console.log("Projects fetched and parsed:", parsedProjects);
      return parsedProjects;
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      return [];
    }
  };

  const mintHypercert = async (
    units: number,
    uri: string,
    restrictions: number = 0
  ): Promise<bigint | null> => {
    if (!signer || !hypercertContract) {
      console.error("Signer or hypercertContract is not initialized");
      return null;
    }

    try {
      const to = await signer.getAddress();

      console.log("Sending mintClaim transaction...");
      const tx = await hypercertContract.mintClaim(
        to,
        units,
        uri,
        restrictions
      );
      console.log("Transaction hash:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction mined in block", receipt.blockNumber);

      // Parse the event logs
      const iface = new ethers.Interface([
        "event ClaimStored(uint256 indexed claimID, string uri, uint256 units)",
      ]);
      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog(log);
          if (parsedLog && parsedLog.name === "ClaimStored") {
            let claimID = parsedLog.args.claimID as bigint;
            console.log(
              `ClaimStored event found - claimID: ${claimID.toString()}, uri: ${
                parsedLog.args.uri
              }, units: ${parsedLog.args.units.toString()}`
            ); // Add BigInt(1) to claimID
            claimID = BigInt(claimID) + BigInt(1);
            console.log(
              `Adjusted claimID: ${claimID.toString()} (added 1 to original)`
            );
            return claimID;
          }
        } catch {
          // Not a ClaimStored event, ignore
        }
      }

      console.warn("No ClaimStored event found in logs.");
      return null;
    } catch (error) {
      console.error("Failed to mint Hypercert:", error);
      return null;
    }
  };

  const approveHypercertTransfer = async (): Promise<boolean> => {
    if (!signer || !hypercertContract) {
      console.error("Signer or Hypercert contract not initialized");
      return false;
    }

    try {
      const tx = await hypercertContract.setApprovalForAll(
        CONTRACT_ADDRESS,
        true
      );
      console.log("Approval tx sent:", tx.hash);
      await tx.wait();
      console.log("Approval transaction confirmed.");
      return true;
    } catch (err) {
      console.error("Approval transaction failed:", err);
      return false;
    }
  };

  const registerProjectCairn = async (
    projectURI: string,
    tokenID: bigint,
    unitPrice: bigint
  ): Promise<void> => {
    if (!signer || !cairnContract) return;

    try {
      const tx = await cairnContract.registerProject(
        projectURI,
        tokenID,
        unitPrice
      );
      await tx.wait();
    } catch (err) {
      console.error("Failed to register project:", err);
      throw err;
    }
  };

  const addOutput = async (
    projectURI: string,
    outputsURI: string
  ): Promise<void> => {
    if (!signer || !cairnContract) return;

    try {
      const tx = await cairnContract.recordOutputs(projectURI, outputsURI);
      await tx.wait();
    } catch (err) {
      console.error("Failed to record outputs:", err);
      throw err;
    }
  };

  const contractDisputeProof = async (
    proofCID: string,
    disputeCID: string
  ): Promise<void> => {
    if (!signer || !cairnContract) return;

    try {
      const tx = await cairnContract.disputeProof(proofCID, disputeCID);
      await tx.wait();
      console.log("Proof disputed successfully:", proofCID);
    } catch (error) {
      console.error("Failed to dispute proof:", error);
      throw error;
    }
  };

  const getProof = async (proofCID: string): Promise<any> => {
    if (!signer || !readOnlyCairn) return;

    try {
      const proof = await readOnlyCairn.getProof(proofCID);
      console.log("Proof retrieved:", proof);
      return proof;
    } catch (error) {
      console.error("Failed to get proof:", error);
      return null;
    }
  };

  const getUserPoRCount = async (userAddress: string): Promise<number> => {
    if (!signer || !readOnlyCairn) return 0;

    try {
      const count = await readOnlyCairn.getUserAvailablePoRCount(userAddress);
      return count.toNumber();
    } catch (error) {
      console.error("Failed to get PoR count:", error);
      return 0;
    }
  };

  const recordPoR = async (
    projectCID: string,
    proofCID: string
  ): Promise<any> => {
    if (!signer || !cairnContract) return;

    try {
      const tx = await cairnContract.recordProof(projectCID, proofCID);
      const receipt = await tx.wait();
      console.log("PoR recorded in transaction:", receipt.transactionHash);
      return receipt;
    } catch (error) {
      console.error("Failed to record PoR:", error);
      throw error;
    }
  };

  const isProofValid = async (proofCID: string): Promise<boolean> => {
    if (!signer || !readOnlyCairn) return false;
    try {
      const isValid = await readOnlyCairn.isProofValid(proofCID);
      return isValid;
    } catch (error) {
      console.error("Failed to validate proof:", error);
      return false;
    }
  };

  const fundProject = async (amount: bigint, projectId: string) => {
    if (!signer || !cairnContract) {
      console.error("Signer or cairnContract is not initialized");
      return;
    }

    try {
      const tx = await cairnContract.fundProject(amount, projectId);
      console.log(`Project ${projectId} funded with ${amount} wei`);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Failed to fund project:", error);
    }
  };

  const approveUSDCTransfer = async (amount: bigint) => {
    if (!signer) {
      console.error("Signer is not initialized");
      return false;
    }

    try {
      const usdcAbi = [
        "function approve(address spender, uint256 amount) returns (bool)",
      ];
      const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, signer);
      const tx = await usdcContract.approve(CONTRACT_ADDRESS, amount);
      await tx.wait();
      console.log("USDC approved for transfer:", tx.hash);
      return true;
    } catch (error) {
      console.error("Failed to approve USDC transfer:", error);
      return false;
    }
  };

  const setProjectImpact = async (projectId: string, impact: number) => {
    if (!signer || !cairnContract) {
      console.error("Signer or cairnContract is not initialized");
      return;
    }

    try {
      const tx = await cairnContract.setProjectImpact(projectId, impact);
      await tx.wait();
      console.log(`Project ${projectId} impact set to ${impact}`);
    } catch (error) {
      console.error("Failed to set project impact:", error);
    }
  };

  const getTokenOwner = async (tokenId: bigint): Promise<string | null> => {
    if (!signer || !readOnlyHypercert) {
      console.error("Signer or hypercertContract is not initialized");
      return null;
    }

    try {
      const owner = await readOnlyHypercert.ownerOf(tokenId);
      return owner;
    } catch (error) {
      console.error("Failed to get token owner:", error);
      return null;
    }
  };

  const getTokenUnits = async (tokenId: bigint): Promise<number | null> => {
    if (!signer || !readOnlyHypercert) {
      console.error("Signer or hypercertContract is not initialized");
      return null;
    }

    try {
      const units = await readOnlyHypercert.unitsOf(tokenId);
      return Number(units);
    } catch (error) {
      console.error("Failed to get token units:", error);
      return null;
    }
  };

  return (
    <ContractContext.Provider
      value={{
        cairnContract,
        hypercertContract,
        signer,
        getAllProjects,
        initWithWallet,
        mintHypercert,
        registerProjectCairn,
        approveHypercertTransfer,
        addOutput,
        getProof,
        getUserPoRCount,
        recordPoR,
        isProofValid,
        contractDisputeProof,
        fundProject,
        approveUSDCTransfer,
        setProjectImpact,
        getTokenOwner,
        getTokenUnits,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useContract must be used within a ContractProvider");
  }
  return context;
};
