const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: {
        values: ["income", "expense"],
        message: "Type must be income or expense",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: {
        values: [
          "salary",
          "freelance",
          "investment",
          "business",
          "rental",
          "other_income",
          "food",
          "housing",
          "transport",
          "utilities",
          "healthcare",
          "education",
          "entertainment",
          "shopping",
          "travel",
          "other_expense",
        ],
        message: "Invalid category",
      },
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      validate: {
        validator: function (v) {
          return v <= new Date();
        },
        message: "Date cannot be in the future",
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
    isDeleted: {
      type: Boolean,
      default: false, // Soft delete support
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for better query performance
transactionSchema.index({ type: 1, category: 1, date: -1 });
transactionSchema.index({ createdBy: 1, date: -1 });
transactionSchema.index({ isDeleted: 1 });

// Only return non-deleted records by default
transactionSchema.pre(/^find/, function (next) {
  if (!this._conditions.includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// Virtual for formatted amount
transactionSchema.virtual("formattedAmount").get(function () {
  return this.type === "income"
    ? `+₹${this.amount.toLocaleString("en-IN")}`
    : `-₹${this.amount.toLocaleString("en-IN")}`;
});

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
