const filecoinStorageService = require("../services/filecoinStorageService");
const logger = require("../utils/logger");
const Project = require("../models/Project");

/**
 * Storage Controller
 * Handles storage cost estimation and project uploads to Filecoin
 */

/**
 * Get storage cost estimate for a project
 * @route POST /api/v1/storage/estimate-cost
 */
exports.estimateStorageCost = async (req, res) => {
  try {
    const { dataSizeBytes, daysOfStorage } = req.body;

    // Validation
    if (!dataSizeBytes || dataSizeBytes <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Valid data size is required",
      });
    }

    if (!daysOfStorage || daysOfStorage <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Valid storage duration is required",
      });
    }

    const costEstimate = await filecoinStorageService.calculateStorageCost(
      dataSizeBytes,
      daysOfStorage
    );

    logger.info(`Storage cost estimated: ${costEstimate.totalCost} USDFC for ${daysOfStorage} days`);

    res.status(200).json({
      status: "success",
      data: {
        costEstimate,
      },
    });
  } catch (error) {
    logger.error(`Error estimating storage cost: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Failed to estimate storage cost",
      error: error.message,
    });
  }
};

/**
 * Get pricing tiers for different storage durations
 * @route POST /api/v1/storage/pricing-tiers
 */
exports.getPricingTiers = async (req, res) => {
  try {
    const { dataSizeBytes } = req.body;

    if (!dataSizeBytes || dataSizeBytes <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Valid data size is required",
      });
    }

    const pricingTiers = await filecoinStorageService.getPricingTiers(dataSizeBytes);

    res.status(200).json({
      status: "success",
      data: {
        pricingTiers,
        dataSizeBytes,
        dataSizeMB: (dataSizeBytes / (1024 * 1024)).toFixed(2),
      },
    });
  } catch (error) {
    logger.error(`Error getting pricing tiers: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Failed to get pricing tiers",
      error: error.message,
    });
  }
};

/**
 * Get current storage pricing info from Synapse
 * @route GET /api/v1/storage/pricing-info
 */
exports.getStoragePricingInfo = async (req, res) => {
  try {
    const storageInfo = await filecoinStorageService.getStorageInfo();

    res.status(200).json({
      status: "success",
      data: {
        pricing: storageInfo.pricing,
        estimatedCost: storageInfo.estimatedCost,
      },
    });
  } catch (error) {
    logger.error(`Error getting storage info: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Failed to get storage pricing info",
      error: error.message,
    });
  }
};

/**
 * Prepare project for upload - downloads HF repo and creates ZIP
 * Returns a temporary URL to download the ZIP
 * @route POST /api/v1/storage/prepare-upload
 */
exports.prepareUpload = async (req, res) => {
  try {
    const { projectId, repoUrl } = req.body;

    const userId = req.user.id;

    // Validation
    if (!projectId) {
      return res.status(400).json({
        status: "error",
        message: "Project ID is required",
      });
    }

    if (!repoUrl) {
      return res.status(400).json({
        status: "error",
        message: "Repository URL is required",
      });
    }

    // Verify project exists and belongs to user
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    if (project.researcher_id.toString() !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to prepare this project",
      });
    }

    logger.info(`Preparing upload for project ${projectId} by user ${userId}`);

    // Download HuggingFace repo
    const repoInfo = await filecoinStorageService.downloadHuggingFaceRepo(repoUrl);
    const repoPath = repoInfo.path;

    // Create ZIP
    const zipPath = await filecoinStorageService.createZipFile(repoPath);

    // Generate a unique temporary ID for this ZIP
    const tempId = `${projectId}_${Date.now()}`;

    // Store ZIP info in memory (or you could use Redis for production)
    global.tempZips = global.tempZips || {};
    global.tempZips[tempId] = {
      zipPath,
      repoPath,
      createdAt: Date.now(),
      projectId,
      userId,
    };

    // Set cleanup timeout (delete after 1 hour)
    setTimeout(() => {
      if (global.tempZips[tempId]) {
        const fs = require("fs");
        try {
          fs.unlinkSync(global.tempZips[tempId].zipPath);
          fs.rmSync(global.tempZips[tempId].repoPath, { recursive: true, force: true });
          delete global.tempZips[tempId];
          logger.info(`Cleaned up temporary files for ${tempId}`);
        } catch (err) {
          logger.error(`Error cleaning up temp files: ${err.message}`);
        }
      }
    }, 60 * 60 * 1000); // 1 hour

    const apiVersion = process.env.API_VERSION || "v1";
    const downloadUrl = `${req.protocol}://${req.get("host")}/api/${apiVersion}/storage/download-temp/${tempId}`;

    logger.info(`Prepared upload for project ${projectId}. Download URL: ${downloadUrl}`);

    res.status(200).json({
      status: "success",
      data: {
        tempId,
        downloadUrl,
        size: repoInfo.size,
        repoPath,
      },
    });
  } catch (error) {
    logger.error(`Error preparing upload: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Failed to prepare upload",
      error: error.message,
    });
  }
};

/**
 * Download temporary ZIP file
 * @route GET /api/v1/storage/download-temp/:tempId
 */
exports.downloadTempZip = async (req, res) => {
  try {
    const { tempId } = req.params;

    if (!global.tempZips || !global.tempZips[tempId]) {
      return res.status(404).json({
        status: "error",
        message: "Temporary file not found or expired",
      });
    }

    const tempZip = global.tempZips[tempId];
    const fs = require("fs");
    const path = require("path");

    if (!fs.existsSync(tempZip.zipPath)) {
      delete global.tempZips[tempId];
      return res.status(404).json({
        status: "error",
        message: "ZIP file not found",
      });
    }

    const fileName = path.basename(tempZip.zipPath);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(tempZip.zipPath);
    fileStream.pipe(res);

    logger.info(`Serving temporary ZIP ${tempId}`);
  } catch (error) {
    logger.error(`Error downloading temp ZIP: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Failed to download temporary file",
      error: error.message,
    });
  }
};

/**
 * Save upload result after user uploads to Filecoin from frontend
 * @route POST /api/v1/storage/save-upload-result
 */
exports.saveUploadResult = async (req, res) => {
  try {
    const { projectId, cid, size, daysOfStorage, paymentTxHash } = req.body;

    const userId = req.user.id;

    // Verify project exists and belongs to user
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    if (project.researcher_id.toString() !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this project",
      });
    }

    // Update project with storage CID
    project.huggingface.contents_cid = cid;
    project.huggingface.storage_expires_at = new Date(
      Date.now() + daysOfStorage * 24 * 60 * 60 * 1000
    );
    await project.save();

    logger.info(`Saved upload result for project ${projectId}. CID: ${cid}`);

    res.status(200).json({
      status: "success",
      message: "Upload result saved successfully",
      data: {
        cid,
        expiresAt: project.huggingface.storage_expires_at,
      },
    });
  } catch (error) {
    logger.error(`Error saving upload result: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Failed to save upload result",
      error: error.message,
    });
  }
};

/**
 * Upload project to Filecoin storage
 * Requires payment to be completed first
 * @route POST /api/v1/storage/upload-project
 */
exports.uploadProjectToStorage = async (req, res) => {
  try {
    const {
      projectId,
      repoUrl,
      daysOfStorage,
      paymentTxHash, // Transaction hash of payment
    } = req.body;

    const userId = req.user.id;

    // Validation
    if (!projectId) {
      return res.status(400).json({
        status: "error",
        message: "Project ID is required",
      });
    }

    if (!repoUrl) {
      return res.status(400).json({
        status: "error",
        message: "Repository URL is required",
      });
    }

    if (!daysOfStorage || daysOfStorage <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Valid storage duration is required",
      });
    }

    // Verify project exists and belongs to user
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    if (project.researcher_id.toString() !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to upload this project",
      });
    }

    logger.info(`Starting upload for project ${projectId} by user ${userId}`);

    // Upload to Filecoin
    const uploadResult = await filecoinStorageService.uploadProject(
      repoUrl,
      daysOfStorage
    );

    // Update project with storage CID
    project.huggingface.contents_cid = uploadResult.cid;
    project.huggingface.storage_expires_at = new Date(
      Date.now() + daysOfStorage * 24 * 60 * 60 * 1000
    );
    await project.save();

    logger.info(`Project ${projectId} uploaded successfully. CID: ${uploadResult.cid}`);

    res.status(200).json({
      status: "success",
      message: "Project uploaded to Filecoin successfully",
      data: {
        cid: uploadResult.cid,
        size: uploadResult.size,
        compressionRatio: uploadResult.compressionRatio,
        daysOfStorage,
        expiresAt: project.huggingface.storage_expires_at,
      },
    });
  } catch (error) {
    logger.error(`Error uploading project: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Failed to upload project to storage",
      error: error.message,
    });
  }
};

/**
 * Get storage status for a project
 * @route GET /api/v1/storage/status/:projectId
 */
exports.getStorageStatus = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const cid = project.huggingface?.contents_cid;
    const expiresAt = project.huggingface?.storage_expires_at;

    const hasStorage = !!cid;
    const isExpired = expiresAt && new Date(expiresAt) < new Date();

    res.status(200).json({
      status: "success",
      data: {
        projectId,
        hasStorage,
        cid,
        expiresAt,
        isExpired,
        daysRemaining: expiresAt
          ? Math.max(
              0,
              Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
            )
          : null,
      },
    });
  } catch (error) {
    logger.error(`Error getting storage status: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Failed to get storage status",
      error: error.message,
    });
  }
};
