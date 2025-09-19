const jwt = require('jsonwebtoken');
const passport = require('passport');
const { asyncHandler, AppError } = require('./errorHandler');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// Middleware to protect routes (JWT authentication)
const authenticate = passport.authenticate('jwt', { session: false });

// Middleware for local authentication (login)
const localAuth = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: info?.message || 'Authentication failed'
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// Middleware to check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// Middleware to check if user is active
const checkActive = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!req.user.isActive) {
    return next(new AppError('Account is deactivated', 403));
  }

  next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    req.user = user || null;
    next();
  })(req, res, next);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  authenticate,
  localAuth,
  authorize,
  checkActive,
  optionalAuth
};
