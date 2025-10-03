const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array()); // For debugging
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Validation rules for creating a project
 */
const validateCreateProject = [
  // Title validation
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Project title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),

  // Field validation
  body("field")
    .notEmpty()
    .withMessage("Research field is required")
    .isIn(["llm", "vision", "nlp", "robotics", "ml", "ai", "other"])
    .withMessage(
      "Field must be one of: llm, vision, nlp, robotics, ml, ai, other"
    ),

  // Description validation (optional)
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  // Paper object validations (all optional)
  // Publication URL validation (optional)
  body("publication_url")
    .optional()
    .isURL()
    .withMessage("Publication URL must be valid"),

  // HuggingFace object validations (all optional) - FIXED FIELD NAMES
  body("huggingface").optional(),
  body("huggingface.repository_url") // Changed from repo_url
    .optional()
    .isURL()
    .withMessage("Invalid repository URL format"),
  body("huggingface.license") // Changed from licence
    .optional()
    .trim()
    .notEmpty()
    .withMessage("License cannot be empty if provided"),
  body("huggingface.model_card_url")
    .optional()
    .isURL()
    .withMessage("Invalid model card URL format"),

  // Project status validation (optional)
  body("project_status")
    .optional()
    .isIn(["Draft", "Pending Evaluation", "Evaluated", "Funded"])
    .withMessage(
      "Project status must be one of: Draft, Pending Evaluation, Evaluated, Funded"
    ),

  // PoR status validation (optional)
  body("por_status")
    .optional()
    .isIn(["InReview", "Disputed", "Phase1", "Phase2"])
    .withMessage(
      "PoR status must be one of: InReview, Disputed, Phase1, Phase2"
    ),

  // Funded amount validation (optional)
  body("funded_amount")
    .optional()
    .isNumeric()
    .withMessage("Funded amount must be a number")
    .custom((value) => {
      if (value < 0) {
        throw new Error("Funded amount must be non-negative");
      }
      return true;
    }),

  // PoR object validations (optional)
  body("por").optional(),
  body("por.por_cid")
    .optional()
    .matches(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{56})$/)
    .withMessage("Invalid IPFS CID format"),
];

module.exports = {
  validateCreateProject,
  handleValidationErrors,
};
