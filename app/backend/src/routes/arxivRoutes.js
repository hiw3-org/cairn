const express = require("express");
const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const { query, max_results = 5 } = req.query;

    const arxivUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${max_results}&sortBy=relevance&sortOrder=descending`;

    const response = await fetch(arxivUrl);
    const xmlText = await response.text();

    res.set("Content-Type", "application/xml");
    res.send(xmlText);
  } catch (error) {
    console.error("arXiv API error:", error);
    res.status(500).json({ error: "Failed to fetch from arXiv" });
  }
});

module.exports = router;
