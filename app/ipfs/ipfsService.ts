import type {
  ProjectRegistration,
  ProjectOutput,
  ProofOfReproducibility,
} from "../lib/types";
import { useIpfs } from "../context/ipfsContext";

export const useIpfsService = () => {
  const ipfsClient = useIpfs();

  const registerProject = async (projectData: ProjectRegistration) => {
    if (!ipfsClient) {
      throw new Error("IPFS client not initialized");
    }
    const bytes = new TextEncoder().encode(JSON.stringify(projectData));
    const file = new File([bytes], `project_${Date.now()}.json`, {
      type: "application/json",
    });
    console.log("Uploading project data to IPFS:", file);
    return ipfsClient.uploadFile(file);
  };

  const uploadProjectOutput = async (projectData: ProjectOutput) => {
    if (!ipfsClient) {
      throw new Error("IPFS client not initialized");
    }
    const bytes = new TextEncoder().encode(JSON.stringify(projectData));
    const file = new File([bytes], `project_${Date.now()}.json`, {
      type: "application/json",
    });
    console.log("Uploading project output data to IPFS:", file);
    return ipfsClient.uploadFile(file);
  };

  const uploadProofOfReproducibility = async (
    proofData: ProofOfReproducibility
  ) => {
    if (!ipfsClient) {
      throw new Error("IPFS client not initialized");
    }
    const bytes = new TextEncoder().encode(JSON.stringify(proofData));
    const file = new File([bytes], `proof_${Date.now()}.json`, {
      type: "application/json",
    });
    console.log("Uploading proof of reproducibility to IPFS:", file);
    return ipfsClient.uploadFile(file);
  };

  return {
    registerProject,
    uploadProjectOutput,
    uploadProofOfReproducibility,
    uploadFile: ipfsClient?.uploadFile.bind(ipfsClient),
    uploadDirectory: ipfsClient?.uploadDirectory.bind(ipfsClient),
    isInitialized: !!ipfsClient,
  };
};
