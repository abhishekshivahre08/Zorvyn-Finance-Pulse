const express = require("express");
const router = express.Router();
const {
  getAllTransactions, getTransactionById, createTransaction,
  updateTransaction, deleteTransaction, restoreTransaction,
} = require("../controllers/transactionController");
const { protect, restrictTo } = require("../middleware/auth");
const {
  validate, createTransactionSchema, updateTransactionSchema, transactionQuerySchema,
} = require("../validators/schemas");

// All routes require authentication
router.use(protect);

// Read: all authenticated users (viewer, analyst, admin)
router.get("/", validate(transactionQuerySchema, "query"), getAllTransactions);
router.get("/:id", getTransactionById);

// Write: admin only
router.post("/", restrictTo("admin"), validate(createTransactionSchema), createTransaction);
router.patch("/:id", restrictTo("admin"), validate(updateTransactionSchema), updateTransaction);
router.delete("/:id", restrictTo("admin"), deleteTransaction);
router.patch("/:id/restore", restrictTo("admin"), restoreTransaction);

module.exports = router;
