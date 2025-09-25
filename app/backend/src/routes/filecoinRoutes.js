const express = require("express");
const {
  healthCheck,
} = require("../controllers/filecoinController");

const router = express.Router();

// Health check endpoint
router.get("/health", healthCheck);

module.exports = router;
