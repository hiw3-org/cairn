const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// @desc    Register user
// @route   POST /api/v1/users/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { address, email, username, password } = req.body;
  
  // Create user (validation middleware already checked for duplicates)
  const user = await User.create({
    address: address ? address.toLowerCase() : undefined,
    email,
    username,
    password
  });
  
  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  logger.auth('user_registered', { userId: user._id, address: user.address });
  
  res.status(201).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        address: user.address,
        email: user.email,
        username: user.username,
        role: user.role
      },
      token,
      refreshToken
    }
  });
});

// @desc    Login user
// @route   POST /api/v1/users/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  // TODO: Implement email/password login
  res.status(200).json({ status: 'success', message: 'Login - to be implemented' });
});

// @desc    Wallet login (Web3)
// @route   POST /api/v1/users/login/wallet
// @access  Public
const walletLogin = asyncHandler(async (req, res) => {
  // TODO: Implement Web3 wallet login with signature verification
  res.status(200).json({ status: 'success', message: 'Wallet login - to be implemented' });
});

// @desc    Get user profile
// @route   GET /api/v1/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  
  res.status(200).json({
    status: 'success',
    data: { user }
  });
});



module.exports = {
  register,
  login,
  walletLogin,
  getProfile
};
