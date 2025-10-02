const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  searchByTitle,
  searchByAuthor,
} = require("../controllers/arxivController");

// @desc    Search ArXiv papers by title
// @route   GET /api/v1/arxiv/search-title?q=query&limit=20
// @access  Private
router.get("/search-title", authenticate, searchByTitle);

// @desc    Search ArXiv papers by author name
// @route   GET /api/v1/arxiv/search-author?author=name&limit=50
// @access  Private
router.get("/search-author", authenticate, searchByAuthor);

module.exports = router;
