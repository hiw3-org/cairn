const Project = require('../models/Project');

/**
 * Get all projects
 * @route GET /api/v1/projects
 * @access Public (could be modified to require authentication)
 */
const getAllProjects = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      field, 
      researcher_id 
    } = req.query;

    // Build filter object
    const filter = {};
    if (field) filter.field = field;
    if (researcher_id) filter.researcher_id = researcher_id;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100); // Cap at 100 items per page

    // Execute query with population and pagination
    const projects = await Project.find(filter)
      .populate('researcher_id', 'username email profile.firstName profile.lastName')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(maxLimit)
      .lean();

    // Get total count for pagination metadata
    const totalProjects = await Project.countDocuments(filter);
    const totalPages = Math.ceil(totalProjects / maxLimit);

    // Send response
    res.status(200).json({
      status: 'success',
      message: 'Projects retrieved successfully',
      data: {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProjects,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: maxLimit
        }
      }
    });

  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve projects',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get single project by ID
 * @route GET /api/v1/projects/:id
 * @access Public
 */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('researcher_id', 'username email profile address');

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Project retrieved successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Get project by ID error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid project ID format'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get projects by field
 * @route GET /api/v1/projects/field/:field
 * @access Public
 */
const getProjectsByField = async (req, res) => {
  try {
    const { field } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate field
    const validFields = ['llm', 'vision', 'nlp', 'robotics', 'ml', 'ai', 'other'];
    if (!validFields.includes(field)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid field. Must be one of: ${validFields.join(', ')}`
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100);

    const projects = await Project.findByField(field)
      .skip(skip)
      .limit(maxLimit)
      .sort({ created_at: -1 });

    const totalProjects = await Project.countDocuments({ field });
    const totalPages = Math.ceil(totalProjects / maxLimit);

    res.status(200).json({
      status: 'success',
      message: `Projects in ${field} field retrieved successfully`,
      data: {
        projects,
        field,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProjects,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: maxLimit
        }
      }
    });

  } catch (error) {
    console.error('Get projects by field error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve projects by field',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create a new project
 * @route POST /api/v1/projects
 * @access Private (requires authentication)
 */
const createProject = async (req, res) => {
  try {
    const {
      title,
      researcher_id: bodyResearcherId, // rename to avoid confusion
      field,
      paper,
      huggingface,
      por
    } = req.body;
    // Determine researcher_id: only allow override if user is admin
    let effectiveResearcherId = req.user && req.user._id;
    if (req.user && req.user.role === 'admin' && bodyResearcherId) {
      effectiveResearcherId = bodyResearcherId;
    }
    // Create new project
    const projectData = {
      title,
      researcher_id: effectiveResearcherId,
      field
    };

    // Add optional nested objects if provided
    if (paper) projectData.paper = paper;
    if (huggingface) projectData.huggingface = huggingface;
    if (por) projectData.por = por;

    const project = new Project(projectData);
    await project.save();

    // Populate the researcher details for response
    await project.populate('researcher_id', 'username email profile.firstName profile.lastName');

    res.status(201).json({
      status: 'success',
      message: 'Project created successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Create project error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Project with this data already exists'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  getProjectsByField,
  createProject
};
