const express = require('express');
const router = express.Router();
const {
  initiateHFAuth,
  handleHFCallback,
  getHFStatus,
  disconnectHF,
  getHFRepos,
  getHFDatasets,
  refreshHFConnection
} = require('../controllers/huggingfaceController');
const { authenticate } = require('../middleware/auth');

// @desc    Initiate HuggingFace OAuth2 flow
// @route   POST /api/v1/integrations/huggingface/auth
// @access  Private
router.post('/auth', authenticate, initiateHFAuth);

// @desc    Handle OAuth2 callback from HuggingFace
// @route   GET /api/v1/integrations/huggingface/callback
// @access  Public (but validates state parameter)
router.get('/callback', handleHFCallback);

// @desc    Get HuggingFace connection status
// @route   GET /api/v1/integrations/huggingface/status
// @access  Private
router.get('/status', authenticate, getHFStatus);

// @desc    Disconnect HuggingFace account
// @route   DELETE /api/v1/integrations/huggingface/disconnect
// @access  Private
router.delete('/disconnect', authenticate, disconnectHF);

// @desc    Get user's HuggingFace repositories
// @route   GET /api/v1/integrations/huggingface/repos
// @access  Private
router.get('/repos', authenticate, getHFRepos);

// @desc    Get user's HuggingFace datasets
// @route   GET /api/v1/integrations/huggingface/datasets
// @access  Private
router.get('/datasets', authenticate, getHFDatasets);

// @desc    Refresh HuggingFace connection
// @route   POST /api/v1/integrations/huggingface/refresh
// @access  Private
router.post('/refresh', authenticate, refreshHFConnection);

module.exports = router;
