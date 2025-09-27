const express = require('express');
const router = express.Router();
const { 
  getAllProjects, 
  getProjectById, 
  getProjectsByField,
  createProject
} = require('../controllers/projectController');

// Import validation middleware
const { validateCreateProject, handleValidationErrors } = require('../middleware/projectValidation');

// Import auth middleware (for protected routes)
const authMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/v1/projects
 * @desc    Get all projects with optional filtering and pagination
 * @access  Public
 * @query   page, limit, field, researcher_id
 */
router.get('/', getAllProjects);

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project
 * @access  Private (requires authentication)
 * @body    title, researcher_id, field, paper?, huggingface?, por?
 */
router.post('/', authMiddleware.authenticate, validateCreateProject, handleValidationErrors, createProject);

/**
 * @route   GET /api/v1/projects/field/:field
 * @desc    Get projects by research field
 * @access  Public
 * @params  field (llm, vision, nlp, robotics, ml, ai, other)
 * @query   page, limit
 */
router.get('/field/:field', getProjectsByField);


/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get single project by ID
 * @access  Public
 * @params  id (MongoDB ObjectId)
 */
router.get('/:id', getProjectById);

module.exports = router;
