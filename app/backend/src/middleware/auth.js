const jwt = require("jsonwebtoken");
const passport = require("passport");
const { asyncHandler, AppError } = require("./errorHandler");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d", // Changed to 7d to match cookie
  });
};

// Generate refresh token (keeping for future use if needed)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
    }
  );
};

// NEW: Middleware to protect routes (reads from cookie)
const authenticate = asyncHandler(async (req, res, next) => {
  // Read token from cookie
  const token = req.cookies.auth_token;

  if (!token) {
    throw new AppError("No authentication token provided", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    // Note: decoded.id comes from generateToken where we use { id: userId }
    req.user = {
      id: decoded.id,
      // If you need role/other info, you can add it to the token or fetch from DB
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Token expired", 401);
    }
    throw new AppError("Invalid authentication token", 403);
  }
});

// Middleware for local authentication (login)
const localAuth = (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: info?.message || "Authentication failed",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// Middleware to check user roles
// NOTE: You'll need to fetch full user from DB if role isn't in token
const authorize = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    // If role is not in req.user, fetch from database
    if (!req.user.role) {
      const User = require("../models/User");
      const user = await User.findById(req.user.id).select("role");
      if (!user) {
        throw new AppError("User not found", 404);
      }
      req.user.role = user.role;
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError("Insufficient permissions", 403);
    }

    next();
  });
};

// Middleware to check if user is active
const checkActive = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  // Fetch active status from database
  const User = require("../models/User");
  const user = await User.findById(req.user.id).select("isActive");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  next();
});

// Optional authentication (doesn't fail if no token)
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies.auth_token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
  } catch (error) {
    req.user = null;
  }

  next();
});

module.exports = {
  generateToken,
  generateRefreshToken,
  authenticate,
  localAuth,
  authorize,
  checkActive,
  optionalAuth,
};
