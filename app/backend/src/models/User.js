const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Privy authentication (primary identifier)
  privyId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  // Wallet address (can be one of multiple linked to Privy account)
  address: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allow null values to be non-unique
    lowercase: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Please provide a valid Ethereum address']
  },

  // Optional profile identifiers (no longer required for auth)
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allow null values to be non-unique
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  username: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  
  // Profile information
  profile: {
    firstName: String,
    lastName: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    website: String,
    twitter: String,
    orcid_id: String
  },

  // Third-party integrations
  integrations: {
    huggingface: {
      connected: { type: Boolean, default: false },
      username: String,
      userId: String,
      accessToken: String,
      refreshToken: String,
      tokenExpiry: Date,
      scopes: [String],
      connectedAt: Date,
      lastSync: Date
    }
  },

  // User roles and permissions
  role: {
    type: String,
    enum: ['researcher', 'funder', 'admin'],
    default: 'researcher'
  },
  permissions: [{
    type: String,
    enum: ['submit_projects', 'fund_projects', 'admin_access']
  }],


  // Authentication (optional, only for legacy email/password users)
  password: {
    type: String,
    required: false,
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  nonce: {
    type: String,
    default: () => Math.floor(Math.random() * 1000000).toString()
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ address: 1 });
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile?.firstName && this.profile?.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username || this.address;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update updatedAt before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to generate new nonce
userSchema.methods.generateNonce = function() {
  this.nonce = Math.floor(Math.random() * 1000000).toString();
  return this.nonce;
};

module.exports = mongoose.model('User', userSchema);
