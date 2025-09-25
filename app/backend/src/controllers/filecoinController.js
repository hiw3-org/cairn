/**
 * Health check for Filecoin service
 * @route GET /api/v1/filecoin/health
 * @access Public
 */
const healthCheck = async (req, res) => {
  res.json({
    status: "success",
    message: "Filecoin service is healthy",
    data: {
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = {
  healthCheck,
};
