const xml2js = require("xml2js");

class ArXivService {
  constructor() {
    this.baseUrl = "http://export.arxiv.org/api/query";
    this.lastRequest = 0; // Rate limiting tracker
  }

  /**
   * Search ArXiv papers by title
   */
  async searchByTitle(title, maxResults = 20) {
    const query = `search_query=ti:"${title}"&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;
    const xmlResponse = await this.makeRateLimitedRequest(
      `${this.baseUrl}?${query}`
    );
    return await this.parseArXivResponse(xmlResponse);
  }

  /**
   * Search ArXiv papers by author name
   */
  async searchByAuthor(authorName, maxResults = 50) {
    const query = `search_query=au:"${authorName}"&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
    const xmlResponse = await this.makeRateLimitedRequest(
      `${this.baseUrl}?${query}`
    );
    return await this.parseArXivResponse(xmlResponse);
  }

  /**
   * Make rate-limited request to ArXiv API (1 request per second)
   */
  async makeRateLimitedRequest(url) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    // ArXiv allows 1 request per second
    if (timeSinceLastRequest < 1000) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 - timeSinceLastRequest)
      );
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `ArXiv API returned ${response.status}: ${response.statusText}`
        );
      }

      this.lastRequest = Date.now();
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to fetch from ArXiv: ${error.message}`);
    }
  }

  /**
   * Parse ArXiv XML response to clean JSON
   */
  async parseArXivResponse(xmlString) {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
      });

      const result = await parser.parseStringPromise(xmlString);

      if (!result.feed) {
        throw new Error("Invalid ArXiv response format");
      }

      const entries = result.feed.entry || [];

      // Handle single entry (ArXiv returns single object instead of array for 1 result)
      const entryArray = Array.isArray(entries) ? entries : [entries];

      return entryArray.map((entry) => this.formatPaperData(entry));
    } catch (error) {
      throw new Error(`Failed to parse ArXiv response: ${error.message}`);
    }
  }

  /**
   * Format paper data for frontend consumption
   */
  formatPaperData(entry) {
    return {
      title: this.cleanTitle(entry.title),
      url: this.findAbstractUrl(entry.link),
      authors: this.extractAuthors(entry.author),
      arxiv_id: this.extractArXivId(entry.id),
      published: entry.published || null,
      categories: this.extractCategories(entry.category),
    };
  }

  /**
   * Clean and trim paper title
   */
  cleanTitle(title) {
    if (!title) return "Unknown Title";
    return title.replace(/\s+/g, " ").trim();
  }

  /**
   * Find the abstract URL from ArXiv links
   */
  findAbstractUrl(links) {
    if (!links) return null;

    const linkArray = Array.isArray(links) ? links : [links];

    // Look for the abstract page URL (text/html type)
    const abstractLink = linkArray.find(
      (link) => link.type === "text/html" || link.href?.includes("/abs/")
    );

    return abstractLink ? abstractLink.href : null;
  }

  /**
   * Extract author names from ArXiv author data
   */
  extractAuthors(authorData) {
    if (!authorData) return [];

    const authors = Array.isArray(authorData) ? authorData : [authorData];
    return authors.map((author) => author.name || "Unknown Author");
  }

  /**
   * Extract ArXiv ID from the full URL
   */
  extractArXivId(idUrl) {
    if (!idUrl) return null;

    // Extract "2024.12345" from "http://arxiv.org/abs/2024.12345v1"
    const match = idUrl.match(/\/abs\/([^v]+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract categories from ArXiv category data
   */
  extractCategories(categoryData) {
    if (!categoryData) return [];

    const categories = Array.isArray(categoryData)
      ? categoryData
      : [categoryData];
    return categories.map((cat) => cat.term || "").filter((term) => term);
  }
}

module.exports = new ArXivService();
