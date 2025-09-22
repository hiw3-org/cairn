const { DataDownloader } = require("../utils/getFilecoinData");
// Create a singleton instance
const dataDownloader = new DataDownloader();

/**
 * Download file from Filecoin and stream to client
 * @route GET /api/v1/filecoin/download/:cid
 * @access Public or Private (depending on your needs)
 */
const downloadFile = async (req, res) => {
  try {
    const { cid } = req.params;
    const { filename } = req.query;

    // Validate CID format
    const cidRegex =
      /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{56,}|bafk[a-z0-9]{56,}|bafz[a-z0-9]{56,})$/;
    if (!cidRegex.test(cid)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid CID format",
      });
    }

    console.log(`Starting download for CID: ${cid}`);
    const startTime = Date.now();

    // Initialize the downloader if not already done
    if (!dataDownloader.synapse) {
      await dataDownloader.initialize();
    }

    // Download from Filecoin using your existing class
    const result = await dataDownloader.downloadFile(cid);

    const endTime = Date.now();
    const downloadDuration = (endTime - startTime) / 1000;

    console.log(
      `✅ Download completed in ${downloadDuration.toFixed(2)} seconds`
    );
    console.log(`📦 File size: ${result.data.length} bytes`);
    console.log(`📝 Content type: ${result.contentType}`);
    console.log(`🔍 First 100 bytes:`, result.data.slice(0, 100));

    // Determine filename
    const downloadFilename =
      filename || result.filename || `file_${cid.slice(0, 8)}.zip`;

    // Set response headers
    res.set({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${downloadFilename}"`,
      "Content-Length": result.data.length.toString(),
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Download-Time": `${downloadDuration.toFixed(2)}s`,
      "X-File-CID": cid,
    });

    // Send the file data as raw buffer to prevent encoding
    res.end(result.data, "binary");
  } catch (error) {
    console.error("Download error:", error);

    if (error.message.includes("PRIVATE_KEY not found")) {
      return res.status(500).json({
        status: "error",
        message: "Filecoin service not configured properly",
      });
    }

    if (error.message.includes("not found") || error.message.includes("404")) {
      return res.status(404).json({
        status: "error",
        message: "File not found on Filecoin network",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Failed to download file from Filecoin",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Health check for Filecoin service
 * @route GET /api/v1/filecoin/health
 * @access Public
 */
const healthCheck = async (req, res) => {
  try {
    if (!dataDownloader.synapse) {
      await dataDownloader.initialize();
    }

    res.json({
      status: "success",
      message: "Filecoin service is healthy",
      data: {
        initialized: !!dataDownloader.synapse,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Filecoin service is unhealthy",
      error: error.message,
    });
  }
};

module.exports = {
  downloadFile,
  healthCheck,
};
