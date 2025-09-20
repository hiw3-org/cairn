const express = require("express");
const {
  downloadFile,
  healthCheck,
} = require("../controllers/filecoinController");

const router = express.Router();

// Health check endpoint
router.get("/health", healthCheck);

// Download file from Filecoin (direct stream)
router.get("/download/:cid", downloadFile);

module.exports = router;
