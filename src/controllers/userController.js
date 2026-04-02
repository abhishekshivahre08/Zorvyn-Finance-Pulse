const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { AppError, asyncHandler, sendSuccess, sendError } = require("../utils/helpers");

// @desc    Get all users (with pagination & search)
// @route   GET /api/users
// @access  Admin only
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "Users fetched successfully", users, {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin only
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found with this ID.", 404));
  }

  return sendSuccess(res, 200, "User fetched successfully", user);
});

// @desc    Create user (admin creates users)
// @route   POST /api/users
// @access  Admin only
const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, status } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email already registered.", 409));
  }

  const user = await User.create({ name, email, password, role, status });

  return sendSuccess(res, 201, "User created successfully", user);
});

// @desc    Update user
// @route   PATCH /api/users/:id
// @access  Admin only
const updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, role, status, password } = req.body;

  // Prevent admin from deactivating themselves
  if (req.params.id === req.user._id.toString() && status === "inactive") {
    return next(new AppError("You cannot deactivate your own account.", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role, status, password },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new AppError("User not found with this ID.", 404));
  }

  return sendSuccess(res, 200, "User updated successfully", user);
});

// @desc    Delete user (soft - deactivate)
// @route   DELETE /api/users/:id
// @access  Admin only
const deleteUser = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user._id.toString()) {
    return next(new AppError("You cannot delete your own account.", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: "inactive" },
    { new: true }
  );

  if (!user) {
    return next(new AppError("User not found with this ID.", 404));
  }

  return sendSuccess(res, 200, "User deactivated successfully", null);
});

// @desc    Get user stats (admin dashboard)
// @route   GET /api/users/stats
// @access  Admin only
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
        admins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
        analysts: { $sum: { $cond: [{ $eq: ["$role", "analyst"] }, 1, 0] } },
        viewers: { $sum: { $cond: [{ $eq: ["$role", "viewer"] }, 1, 0] } },
      },
    },
  ]);

  return sendSuccess(res, 200, "User statistics fetched successfully", stats[0] || {
    total: 0, active: 0, inactive: 0, admins: 0, analysts: 0, viewers: 0,
  });
});

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, getUserStats };
