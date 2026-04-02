const express = require("express");
const router = express.Router();
const {
  getDashboardSummary, getTrends, getCategoryTotals, getBalanceOverview,
} = require("../controllers/dashboardController");
const { protect, restrictTo } = require("../middleware/auth");

// All dashboard routes require login + analyst or admin role
router.use(protect);
router.use(restrictTo("analyst", "admin"));

router.get("/summary", getDashboardSummary);
router.get("/trends", getTrends);
router.get("/categories", getCategoryTotals);
router.get("/balance", getBalanceOverview);

module.exports = router;
