const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError, asyncHandler, sendSuccess, sendError } = require("../utils/helpers");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Format user response
const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email already registered. Please use a different email or login.", 409));
  }

  const user = await User.create({ name, email, password, role: role || "viewer" });
  const token = generateToken(user._id);

  return sendSuccess(res, 201, "Account created successfully. Welcome!", {
    user: formatUser(user),
    token,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user with password (select: false by default)
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("Invalid email or password.", 401));
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError("Invalid email or password.", 401));
  }

  // Check if user is active
  if (user.status === "inactive") {
    return next(new AppError("Your account has been deactivated. Please contact admin.", 403));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  return sendSuccess(res, 200, "Login successful. Welcome back!", {
    user: formatUser(user),
    token,
  });
});

// @desc    Get my profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Profile fetched successfully", {
    user: formatUser(req.user),
  });
});

// @desc    Update my password
// @route   PATCH /api/auth/update-password
// @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError("Please provide both current and new password.", 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError("New password must be at least 6 characters.", 400));
  }

  const user = await User.findById(req.user._id).select("+password");
  const isValid = await user.comparePassword(currentPassword);

  if (!isValid) {
    return next(new AppError("Current password is incorrect.", 401));
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);

  return sendSuccess(res, 200, "Password updated successfully.", {
    token,
  });
});

module.exports = { register, login, getMe, updatePassword };
