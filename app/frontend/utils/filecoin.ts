export interface FileCoinDownloadOptions {
  walletAddress: string;
  pieceCID: string;
  filename?: string;
  baseUrl?: string;
  chain?: string;
}

export interface FileCoinDownloadResult {
  success: boolean;
  filename: string;
  error?: string;
}

/**
 * Download a file from FileCoin using the direct URL pattern
 * @param options Download options
 * @returns Promise with download result
 */
export async function downloadFromFileCoin({
  walletAddress,
  pieceCID,
  filename,
  baseUrl,
  chain,
}: FileCoinDownloadOptions): Promise<FileCoinDownloadResult> {
  try {
    // Get chain from environment variable or use provided chain or default to calibration
    const filecoinChain =
      chain || import.meta.env.VITE_FILECOIN_CHAIN || "calibration";

    // Construct the base URL with the chain
    // Construct the FileCoin download URL
    const downloadUrl =
      (baseUrl
        ? `${baseUrl}/${pieceCID}`
        : `https://${walletAddress}.${filecoinChain}.filbeam.io/${pieceCID}`);
    const finalFilename = filename || `cairn_${pieceCID.slice(0, 8)}.zip`;

    console.log(`Downloading from FileCoin URL: ${downloadUrl}`);

    // Fetch the file
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download: ${response.status} ${response.statusText}`
      );
    }

    // Get the blob data
    const blob = await response.blob();

    // Create download link and trigger download
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);

    console.log(`File downloaded: ${finalFilename}`);
    return { success: true, filename: finalFilename };
  } catch (err: any) {
    const errorMessage =
      err.message || `Failed to download file with CID: ${pieceCID}`;
    console.error("FileCoin download failed:", err);
    return { success: false, filename: "", error: errorMessage };
  }
}
