// context/filecoin-context.tsx
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// Types
interface DownloadResult {
  data: Uint8Array;
  cid: string;
  filename: string;
  contentType: string;
  downloadUrl?: string; // For browser downloads
}

interface FileCoinContextType {
  // State
  isInitializing: boolean;
  isDownloading: boolean;
  error: string | null;

  // Methods
  downloadFile: (cid: string) => Promise<DownloadResult>;
  downloadAndSaveFile: (cid: string, filename?: string) => Promise<void>;
  clearError: () => void;
}

const FileCoinContext = createContext<FileCoinContextType | undefined>(
  undefined
);

// Generate a random private key for browser session
const generateEphemeralPrivateKey = (): string => {
  // Generate 32 random bytes for private key
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);

  // Convert to hex string with 0x prefix
  const privateKey =
    "0x" +
    Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return privateKey;
};

interface FileCoinProviderProps {
  children: React.ReactNode;
  rpcUrl?: string;
}

export const FileCoinProvider = ({
  children,
  rpcUrl,
}: FileCoinProviderProps) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synapse, setSynapse] = useState<any>(null);

  // Initialize Synapse SDK with ephemeral key
  const initializeSynapse = useCallback(async () => {
    if (synapse) return synapse; // Already initialized

    setIsInitializing(true);
    setError(null);

    try {
      // Dynamic import of Synapse SDK (since it might not be available in all environments)
      const { Synapse, RPC_URLS } = await import("@filoz/synapse-sdk");

      // Generate ephemeral private key for this session
      const ephemeralPrivateKey = generateEphemeralPrivateKey();
      console.log("Generated ephemeral key for FileCoin downloads");

      const rpcURL = rpcUrl || RPC_URLS.calibration.http;

      const synapseInstance = await Synapse.create({
        privateKey: ephemeralPrivateKey,
        rpcURL: rpcURL,
      });

      setSynapse(synapseInstance);
      return synapseInstance;
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to initialize FileCoin connection";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  }, [synapse, rpcUrl]);

  // Download file from FileCoin
  const downloadFile = useCallback(
    async (cid: string): Promise<DownloadResult> => {
      setIsDownloading(true);
      setError(null);

      try {
        const synapseInstance = await initializeSynapse();

        console.log(`Downloading from FileCoin - CID: ${cid}`);
        const data = await synapseInstance.storage.download(cid);

        const result: DownloadResult = {
          data: data,
          cid: cid,
          filename: `cairn_${cid.slice(0, 8)}.zip`,
          contentType: "application/zip",
        };

        console.log(`Successfully downloaded ${result.filename}`);
        return result;
      } catch (err: any) {
        const errorMessage =
          err.message || `Failed to download file with CID: ${cid}`;
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsDownloading(false);
      }
    },
    [initializeSynapse]
  );

  // Download file and trigger browser download
  const downloadAndSaveFile = useCallback(
    async (cid: string, filename?: string): Promise<void> => {
      try {
        const result = await downloadFile(cid);

        // Create blob and download URL
        const blob = new Blob([result.data], { type: result.contentType });
        const downloadUrl = URL.createObjectURL(blob);

        // Create temporary link element and trigger download
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename || result.filename;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        console.log(`File downloaded to browser: ${link.download}`);
      } catch (err: any) {
        console.error("Download and save failed:", err);
        throw err;
      }
    },
    [downloadFile]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: FileCoinContextType = {
    isInitializing,
    isDownloading,
    error,
    downloadFile,
    downloadAndSaveFile,
    clearError,
  };

  return (
    <FileCoinContext.Provider value={value}>
      {children}
    </FileCoinContext.Provider>
  );
};

export const useFileCoin = () => {
  const context = useContext(FileCoinContext);
  if (context === undefined) {
    throw new Error("useFileCoin must be used within a FileCoinProvider");
  }
  return context;
};

// Hook for easy downloading with error handling
export const useFileCoinDownload = () => {
  const { downloadAndSaveFile, isDownloading, error, clearError } =
    useFileCoin();

  const downloadWithToast = useCallback(
    async (
      cid: string,
      filename?: string,
      onSuccess?: () => void,
      onError?: (error: string) => void
    ) => {
      try {
        clearError();
        await downloadAndSaveFile(cid, filename);
        onSuccess?.();
      } catch (err: any) {
        const errorMessage = err.message || "Download failed";
        onError?.(errorMessage);
      }
    },
    [downloadAndSaveFile, clearError]
  );

  return {
    download: downloadWithToast,
    isDownloading,
    error,
    clearError,
  };
};
