const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const logger = require("./utils/logger");
const { errorHandler } = require("./middleware/errorHandler");
const { connectDB, disconnectDB } = require("./config/database");
const huggingfacePollingService = require("./services/huggingfacePollingService");

// Import Passport configuration
require("./config/passport");
const passport = require("passport");

// Import routes
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const filecoinRoutes = require("./routes/filecoinRoutes");
const huggingfaceRoutes = require("./routes/huggingfaceRoutes");
const arxivRoutes = require("./routes/arxivRoutes");
const onrampRoutes = require("./routes/onrampRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy for rate limiting behind reverse proxy
app.set("trust proxy", 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cookieParser()); // Parse cookies
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(limiter); // Rate limiting
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize()); // Prevent NoSQL injection

// Initialize Passport
app.use(passport.initialize());

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Cairn Backend API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
const apiVersion = process.env.API_VERSION || "v1";
app.use(`/api/${apiVersion}/users`, userRoutes);
app.use(`/api/${apiVersion}/projects`, projectRoutes);
app.use(`/api/${apiVersion}/filecoin`, filecoinRoutes);
app.use(`/api/${apiVersion}/integrations/huggingface`, huggingfaceRoutes);
app.use(`/api/${apiVersion}/arxiv`, arxivRoutes);
app.use(`/api/${apiVersion}/onramp`, onrampRoutes);

// Catch-all route for undefined endpoints
app.all("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  logger.info(
    `🚀 Cairn Backend server running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );

  // Start HuggingFace metrics polling cron job
  huggingfacePollingService.startCronJob();
  logger.info("📊 HuggingFace metrics polling service started");

  // Run initial poll on server startup
  try {
    logger.info("🔄 Running initial HuggingFace metrics poll...");
    await huggingfacePollingService.pollAllProjects();
  } catch (error) {
    logger.error(`Initial HuggingFace poll failed: ${error.message}`);
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(async () => {
    // Stop polling service
    huggingfacePollingService.stopCronJob();
    await disconnectDB();
    logger.info("💥 Process terminated!");
  });
});

module.exports = app;
