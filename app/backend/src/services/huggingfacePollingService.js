const cron = require("node-cron");
const Project = require("../models/Project");
const huggingfaceService = require("./huggingfaceService");
const logger = require("../utils/logger");

class HuggingFacePollingService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Poll all projects with HuggingFace repositories and update their metrics
   */
  async pollAllProjects() {
    if (this.isRunning) {
      logger.warn("HuggingFace polling already in progress, skipping");
      return { status: "skipped", message: "Polling already in progress" };
    }

    this.isRunning = true;
    const startTime = Date.now();
    logger.info("Starting HuggingFace metrics polling");

    try {
      // Find all projects with HuggingFace repository URLs
      const projects = await Project.find({
        "huggingface.repository_url": { $exists: true, $ne: "" },
      });

      logger.info(`Found ${projects.length} projects with HuggingFace repositories`);

      let successCount = 0;
      let failCount = 0;
      const errors = [];

      // Poll each project
      for (const project of projects) {
        try {
          const metrics = await huggingfaceService.getPublicRepoMetrics(
            project.huggingface.repository_url
          );

          await Project.findByIdAndUpdate(project._id, {
            $set: {
              "huggingface.metrics.likes": metrics.likes,
              "huggingface.metrics.downloads": metrics.downloads,
              "huggingface.metrics.lastModified": metrics.lastModified,
              "huggingface.metrics.lastUpdated": new Date(),
            },
          });

          successCount++;
          logger.info(
            `Updated metrics for project ${project._id}: ${metrics.likes} likes, ${metrics.downloads} downloads`
          );
        } catch (error) {
          failCount++;
          const errorMsg = `Failed to update metrics for project ${project._id} (${project.huggingface.repository_url}): ${error.message}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      const result = {
        status: "completed",
        totalProjects: projects.length,
        successCount,
        failCount,
        duration: `${duration}ms`,
        errors: errors.length > 0 ? errors : undefined,
      };

      logger.info(
        `HuggingFace polling completed: ${successCount} successful, ${failCount} failed in ${duration}ms`
      );

      return result;
    } catch (error) {
      logger.error(`HuggingFace polling failed: ${error.message}`);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the cron job to poll every 24 hours
   * Runs at midnight (00:00) every day
   */
  startCronJob() {
    if (this.cronJob) {
      logger.warn("HuggingFace polling cron job already started");
      return;
    }

    // Schedule: Run at midnight every day (0 0 * * *)
    // For testing, you can use '*/5 * * * *' for every 5 minutes
    this.cronJob = cron.schedule("0 0 * * *", async () => {
      logger.info("HuggingFace metrics cron job triggered");
      try {
        await this.pollAllProjects();
      } catch (error) {
        logger.error(`HuggingFace cron job error: ${error.message}`);
      }
    });

    logger.info("HuggingFace polling cron job started (runs daily at midnight)");
  }

  /**
   * Stop the cron job
   */
  stopCronJob() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info("HuggingFace polling cron job stopped");
    }
  }

  /**
   * Get current polling status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      cronJobActive: this.cronJob !== null,
      schedule: "Daily at midnight (00:00)",
    };
  }
}

module.exports = new HuggingFacePollingService();
