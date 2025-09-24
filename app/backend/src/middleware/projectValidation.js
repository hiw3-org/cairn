const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validation rules for creating a project
 */
const validateCreateProject = [
  // Title validation
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  // Researcher ID validation
  body('researcher_id')
    .notEmpty()
    .withMessage('Researcher ID is required')
    .custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid researcher ID format');
      }
      return true;
    }),

  // Field validation
  body('field')
    .notEmpty()
    .withMessage('Research field is required')
    .isIn(['llm', 'vision', 'nlp', 'robotics', 'ml', 'ai', 'other'])
    .withMessage('Field must be one of: llm, vision, nlp, robotics, ml, ai, other'),

  // Paper object validations (optional)
  body('paper.doi')
    .optional()
    .matches(/^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/)
    .withMessage('Invalid DOI format'),

  body('paper.arxiv_id')
    .optional()
    .matches(/^\d{4}\.\d{4,5}(v\d+)?$/)
    .withMessage('Invalid arXiv ID format'),

  body('paper.title')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Paper title cannot exceed 300 characters'),

  body('paper.abstract')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Abstract cannot exceed 5000 characters'),

  // HuggingFace object validations (optional)
  body('huggingface.repo_url')
    .optional()
    .isURL()
    .withMessage('Invalid URL format')
    .matches(/^https:\/\/huggingface\.co\/[\w\-\.\/]+$/)
    .withMessage('Must be a valid HuggingFace repository URL'),

  body('huggingface.commit_hash')
    .optional()
    .matches(/^[a-f0-9]{7,40}$/)
    .withMessage('Invalid commit hash format'),

  body('huggingface.files')
    .optional()
    .trim()
    .custom(value => {
      if (value) {
        const files = value.split(';');
        if (!files.every(file => file.trim().length > 0)) {
          throw new Error('Files must be semicolon-separated list of valid filenames');
        }
      }
      return true;
    }),

  // PoR object validations (optional)
  body('por.por_cid')
    .optional()
    .matches(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{56})$/)
    .withMessage('Invalid IPFS CID format'),

  // Description validation (optional)
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  // Project status validation (optional)
  body('project_status')
    .optional()
    .isIn(['Draft', 'Pending Evaluation', 'Evaluated', 'Funded'])
    .withMessage('Project status must be one of: Draft, Pending Evaluation, Evaluated, Funded'),

  // PoR status validation (optional)
  body('por_status')
    .optional()
    .isIn(['InReview', 'Disputed', 'Phase1', 'Phase2'])
    .withMessage('PoR status must be one of: InReview, Disputed, Phase1, Phase2'),

  // Funded amount validation (optional)
  body('funded_amount')
    .optional()
    .isNumeric()
    .withMessage('Funded amount must be a number')
    .custom(value => {
      if (value < 0) {
        throw new Error('Funded amount must be non-negative');
      }
      return true;
    }),

  // HuggingFace licence validation (optional)
  body('huggingface.licence')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Licence cannot be empty if provided')
];

module.exports = {
  validateCreateProject,
  handleValidationErrors
};
