const Transaction = require("../models/Transaction");
const { AppError, asyncHandler, sendSuccess } = require("../utils/helpers");

// @desc    Get all transactions (with filtering, search, pagination)
// @route   GET /api/transactions
// @access  All authenticated users
const getAllTransactions = asyncHandler(async (req, res) => {
  const {
    type, category, startDate, endDate,
    page = 1, limit = 10, sortBy = "date", sortOrder = "desc", search,
  } = req.query;

  // Build filter object
  const filter = {};

  if (type) filter.type = type;
  if (category) filter.category = category;

  // Date range filter
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include full end day
      filter.date.$lte = end;
    }
  }

  // Search in title and notes
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { notes: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate("createdBy", "name email role")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Transaction.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "Transactions fetched successfully", transactions, {
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrevPage: parseInt(page) > 1,
    },
    appliedFilters: { type, category, startDate, endDate, search },
  });
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  All authenticated users
const getTransactionById = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id).populate(
    "createdBy",
    "name email role"
  );

  if (!transaction) {
    return next(new AppError("Transaction not found with this ID.", 404));
  }

  return sendSuccess(res, 200, "Transaction fetched successfully", transaction);
});

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Admin only
const createTransaction = asyncHandler(async (req, res) => {
  const { title, amount, type, category, date, notes } = req.body;

  const transaction = await Transaction.create({
    title,
    amount,
    type,
    category,
    date,
    notes,
    createdBy: req.user._id,
  });

  const populated = await transaction.populate("createdBy", "name email role");

  return sendSuccess(res, 201, "Transaction created successfully", populated);
});

// @desc    Update transaction
// @route   PATCH /api/transactions/:id
// @access  Admin only
const updateTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new AppError("Transaction not found with this ID.", 404));
  }

  const updated = await Transaction.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate("createdBy", "name email role");

  return sendSuccess(res, 200, "Transaction updated successfully", updated);
});

// @desc    Delete transaction (soft delete)
// @route   DELETE /api/transactions/:id
// @access  Admin only
const deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new AppError("Transaction not found with this ID.", 404));
  }

  // Soft delete
  await Transaction.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return sendSuccess(res, 200, "Transaction deleted successfully", null);
});

// @desc    Restore soft-deleted transaction
// @route   PATCH /api/transactions/:id/restore
// @access  Admin only
const restoreTransaction = asyncHandler(async (req, res, next) => {
  // Use includeDeleted flag to bypass default filter
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    includeDeleted: true,
    isDeleted: true,
  });

  if (!transaction) {
    return next(new AppError("Deleted transaction not found with this ID.", 404));
  }

  await Transaction.findByIdAndUpdate(req.params.id, {
    isDeleted: false,
    deletedAt: null,
  });

  return sendSuccess(res, 200, "Transaction restored successfully", null);
});

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  restoreTransaction,
};
