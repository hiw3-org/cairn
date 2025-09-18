const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  researcher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Researcher ID is required'],
    validate: {
      validator: async function(researcherId) {
        const user = await mongoose.model('User').findById(researcherId);
        return user && user.role === 'researcher';
      },
      message: 'Referenced user must have researcher role'
    }
  },
  
  field: {
    type: String,
    required: [true, 'Research field is required'],
    enum: {
      values: ['llm', 'vision', 'nlp', 'robotics', 'ml', 'ai', 'other'],
      message: 'Field must be one of: llm, vision, nlp, robotics, ml, ai, other'
    }
  },
  
  paper: {
    doi: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          return /^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/.test(v);
        },
        message: 'Invalid DOI format'
      }
    },
    arxiv_id: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          return /^\d{4}\.\d{4,5}(v\d+)?$/.test(v);
        },
        message: 'Invalid arXiv ID format'
      }
    },
    title: {
      type: String,
      trim: true,
      maxlength: [300, 'Paper title cannot exceed 300 characters']
    },
    abstract: {
      type: String,
      trim: true,
      maxlength: [5000, 'Abstract cannot exceed 5000 characters']
    }
  },
  
  huggingface: {
    repo_url: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          return /^https:\/\/huggingface\.co\/[\w\-\.\/]+$/.test(v);
        },
        message: 'Invalid HuggingFace repository URL'
      }
    },
    commit_hash: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          return /^[a-f0-9]{7,40}$/.test(v);
        },
        message: 'Invalid commit hash format'
      }
    },
    files: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          // Validate semicolon-separated file list
          const files = v.split(';');
          return files.every(file => file.trim().length > 0);
        },
        message: 'Files must be semicolon-separated list of valid filenames'
      }
    }
  },
  
  por: {
    por_cid: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          // Basic CID validation (starts with 'Qm' or 'baf' for IPFS CIDs)
          return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{56})$/.test(v);
        },
        message: 'Invalid IPFS CID format'
      }
    }
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
projectSchema.index({ researcher_id: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ field: 1 });
projectSchema.index({ created_at: -1 });

// Virtual to get researcher details
projectSchema.virtual('researcher', {
  ref: 'User',
  localField: 'researcher_id',
  foreignField: '_id',
  justOne: true
});


// Static method to find projects by field
projectSchema.statics.findByField = function(field) {
  return this.find({ field: field }).populate('researcher_id', 'username email');
};


const Project = mongoose.model('Project', projectSchema);

module.exports = Project;