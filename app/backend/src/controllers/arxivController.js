const arxivService = require("../services/arxivService");

/**
 * Search ArXiv papers by title
 */
const searchByTitle = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    // Validate input
    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const trimmedQuery = q.trim();
    if (trimmedQuery.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 3 characters long",
      });
    }

    // Validate limit parameter
    const maxResults = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

    // Search ArXiv
    const papers = await arxivService.searchByTitle(trimmedQuery, maxResults);

    res.json({
      success: true,
      data: {
        papers,
        total: papers.length,
        query: trimmedQuery,
        limit: maxResults,
      },
    });
  } catch (error) {
    console.error("ArXiv search by title error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search ArXiv. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Search ArXiv papers by author name
 */
const searchByAuthor = async (req, res) => {
  try {
    const { author, limit = 50 } = req.query;

    // Validate input
    if (!author || typeof author !== "string") {
      return res.status(400).json({
        success: false,
        message: "Author name is required",
      });
    }

    const trimmedAuthor = author.trim();
    if (trimmedAuthor.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Author name must be at least 2 characters long",
      });
    }

    // Validate limit parameter
    const maxResults = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

    // Search ArXiv
    const papers = await arxivService.searchByAuthor(trimmedAuthor, maxResults);

    res.json({
      success: true,
      data: {
        papers,
        total: papers.length,
        author: trimmedAuthor,
        limit: maxResults,
      },
    });
  } catch (error) {
    console.error("ArXiv search by author error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search ArXiv. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  searchByTitle,
  searchByAuthor,
};
