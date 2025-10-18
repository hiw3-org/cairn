const express = require("express");
const { asyncHandler } = require("../middleware/errorHandler");
const { authenticate } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");
const storageController = require("../controllers/storageController");

const router = express.Router();

/**
 * Validation middleware
 */
const validateEstimateCost = [
  body("dataSizeBytes")
    .notEmpty()
    .withMessage("Data size is required")
    .isInt({ min: 1 })
    .withMessage("Data size must be a positive integer"),
  body("daysOfStorage")
    .notEmpty()
    .withMessage("Storage duration is required")
    .isInt({ min: 1, max: 730 })
    .withMessage("Storage duration must be between 1 and 730 days"),
];

const validatePricingTiers = [
  body("dataSizeBytes")
    .notEmpty()
    .withMessage("Data size is required")
    .isInt({ min: 1 })
    .withMessage("Data size must be a positive integer"),
];

const validateUploadProject = [
  body("projectId")
    .notEmpty()
    .withMessage("Project ID is required")
    .isMongoId()
    .withMessage("Invalid project ID"),
  body("repoUrl")
    .notEmpty()
    .withMessage("Repository URL is required")
    .isURL()
    .withMessage("Invalid repository URL"),
  body("daysOfStorage")
    .notEmpty()
    .withMessage("Storage duration is required")
    .isInt({ min: 1, max: 730 })
    .withMessage("Storage duration must be between 1 and 730 days"),
  body("paymentTxHash")
    .optional()
    .isString()
    .withMessage("Invalid payment transaction hash"),
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @desc    Get storage cost estimate
 * @route   POST /api/v1/storage/estimate-cost
 * @access  Public
 */
router.post(
  "/estimate-cost",
  validateEstimateCost,
  handleValidationErrors,
  asyncHandler(storageController.estimateStorageCost)
);

/**
 * @desc    Get pricing tiers for different durations
 * @route   POST /api/v1/storage/pricing-tiers
 * @access  Public
 */
router.post(
  "/pricing-tiers",
  validatePricingTiers,
  handleValidationErrors,
  asyncHandler(storageController.getPricingTiers)
);

/**
 * @desc    Get storage pricing info from Synapse
 * @route   GET /api/v1/storage/pricing-info
 * @access  Public
 */
router.get(
  "/pricing-info",
  asyncHandler(storageController.getStoragePricingInfo)
);

/**
 * @desc    Prepare project for upload (download HF repo and create ZIP)
 * @route   POST /api/v1/storage/prepare-upload
 * @access  Private (requires authentication)
 */
router.post(
  "/prepare-upload",
  authenticate,
  [
    body("projectId").notEmpty().isMongoId(),
    body("repoUrl").notEmpty().isURL(),
  ],
  handleValidationErrors,
  asyncHandler(storageController.prepareUpload)
);

/**
 * @desc    Download temporary ZIP file
 * @route   GET /api/v1/storage/download-temp/:tempId
 * @access  Public (temporary file access)
 */
router.get(
  "/download-temp/:tempId",
  asyncHandler(storageController.downloadTempZip)
);

/**
 * @desc    Save upload result after frontend uploads to Filecoin
 * @route   POST /api/v1/storage/save-upload-result
 * @access  Private (requires authentication)
 */
router.post(
  "/save-upload-result",
  authenticate,
  [
    body("projectId").notEmpty().isMongoId(),
    body("cid").notEmpty().isString(),
    body("size").optional().isInt(),
    body("daysOfStorage").notEmpty().isInt({ min: 1 }),
    body("paymentTxHash").optional().isString(),
  ],
  handleValidationErrors,
  asyncHandler(storageController.saveUploadResult)
);

/**
 * @desc    Upload project to Filecoin storage
 * @route   POST /api/v1/storage/upload-project
 * @access  Private (requires authentication)
 */
router.post(
  "/upload-project",
  authenticate,
  validateUploadProject,
  handleValidationErrors,
  asyncHandler(storageController.uploadProjectToStorage)
);

/**
 * @desc    Get storage status for a project
 * @route   GET /api/v1/storage/status/:projectId
 * @access  Public
 */
router.get(
  "/status/:projectId",
  asyncHandler(storageController.getStorageStatus)
);

module.exports = router;
