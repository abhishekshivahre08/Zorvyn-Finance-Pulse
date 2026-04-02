const Transaction = require("../models/Transaction");
const { asyncHandler, sendSuccess } = require("../utils/helpers");

// Helper: Get date range for period
const getDateRange = (period) => {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(now.getMonth() - 3);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1); // Default: last month
  }

  return { startDate: start, endDate: now };
};

// @desc    Get full dashboard summary
// @route   GET /api/dashboard/summary
// @access  Analyst + Admin
const getDashboardSummary = asyncHandler(async (req, res) => {
  const { period = "month" } = req.query;
  const { startDate, endDate } = getDateRange(period);

  // Aggregate: Overall totals
  const [overallStats, periodStats, categoryBreakdown, recentActivity] = await Promise.all([
    // All-time totals
    Transaction.aggregate([
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),

    // Period-specific totals
    Transaction.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avg: { $avg: "$amount" },
        },
      },
    ]),

    // Category-wise breakdown for the period
    Transaction.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { type: "$type", category: "$category" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]),

    // Recent 5 transactions
    Transaction.find({})
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  // Parse overall stats
  const allTimeIncome = overallStats.find((s) => s._id === "income")?.total || 0;
  const allTimeExpense = overallStats.find((s) => s._id === "expense")?.total || 0;

  // Parse period stats
  const periodIncome = periodStats.find((s) => s._id === "income");
  const periodExpense = periodStats.find((s) => s._id === "expense");

  // Format category breakdown
  const categories = {};
  categoryBreakdown.forEach(({ _id, total, count }) => {
    if (!categories[_id.type]) categories[_id.type] = [];
    categories[_id.type].push({ category: _id.category, total, count });
  });

  return sendSuccess(res, 200, "Dashboard summary fetched successfully", {
    overview: {
      allTime: {
        totalIncome: allTimeIncome,
        totalExpense: allTimeExpense,
        netBalance: allTimeIncome - allTimeExpense,
        totalTransactions: (overallStats.reduce((a, s) => a + s.count, 0)),
      },
      period: {
        label: period,
        from: startDate,
        to: endDate,
        income: {
          total: periodIncome?.total || 0,
          count: periodIncome?.count || 0,
          average: Math.round(periodIncome?.avg || 0),
        },
        expense: {
          total: periodExpense?.total || 0,
          count: periodExpense?.count || 0,
          average: Math.round(periodExpense?.avg || 0),
        },
        netBalance: (periodIncome?.total || 0) - (periodExpense?.total || 0),
        savingsRate: periodIncome?.total
          ? (((periodIncome.total - (periodExpense?.total || 0)) / periodIncome.total) * 100).toFixed(1)
          : 0,
      },
    },
    categoryBreakdown: categories,
    recentActivity: recentActivity,
  });
});

// @desc    Monthly / Weekly trend data
// @route   GET /api/dashboard/trends
// @access  Analyst + Admin
const getTrends = asyncHandler(async (req, res) => {
  const { groupBy = "month", months = 6 } = req.query;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));

  let groupFormat;
  if (groupBy === "week") {
    groupFormat = {
      year: { $year: "$date" },
      week: { $week: "$date" },
    };
  } else {
    groupFormat = {
      year: { $year: "$date" },
      month: { $month: "$date" },
    };
  }

  const trends = await Transaction.aggregate([
    { $match: { date: { $gte: startDate } } },
    {
      $group: {
        _id: { ...groupFormat, type: "$type" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } },
  ]);

  // Restructure for chart consumption
  const trendMap = {};
  trends.forEach(({ _id, total, count }) => {
    const key =
      groupBy === "week"
        ? `${_id.year}-W${String(_id.week).padStart(2, "0")}`
        : `${_id.year}-${String(_id.month).padStart(2, "0")}`;

    if (!trendMap[key]) trendMap[key] = { period: key, income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };

    if (_id.type === "income") {
      trendMap[key].income = total;
      trendMap[key].incomeCount = count;
    } else {
      trendMap[key].expense = total;
      trendMap[key].expenseCount = count;
    }
  });

  const chartData = Object.values(trendMap).map((d) => ({
    ...d,
    net: d.income - d.expense,
  }));

  return sendSuccess(res, 200, "Trend data fetched successfully", {
    groupBy,
    data: chartData,
  });
});

// @desc    Category-wise totals
// @route   GET /api/dashboard/categories
// @access  Analyst + Admin
const getCategoryTotals = asyncHandler(async (req, res) => {
  const { type, startDate, endDate } = req.query;

  const match = {};
  if (type) match.type = type;
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const categories = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: { category: "$category", type: "$type" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
        avgAmount: { $avg: "$amount" },
        minAmount: { $min: "$amount" },
        maxAmount: { $max: "$amount" },
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Group by type
  const result = { income: [], expense: [] };
  categories.forEach(({ _id, total, count, avgAmount, minAmount, maxAmount }) => {
    if (result[_id.type]) {
      result[_id.type].push({
        category: _id.category,
        total: Math.round(total),
        count,
        average: Math.round(avgAmount),
        min: minAmount,
        max: maxAmount,
      });
    }
  });

  // Calculate percentages
  const incomeTotal = result.income.reduce((sum, c) => sum + c.total, 0);
  const expenseTotal = result.expense.reduce((sum, c) => sum + c.total, 0);

  result.income = result.income.map((c) => ({
    ...c,
    percentage: incomeTotal ? ((c.total / incomeTotal) * 100).toFixed(1) : 0,
  }));
  result.expense = result.expense.map((c) => ({
    ...c,
    percentage: expenseTotal ? ((c.total / expenseTotal) * 100).toFixed(1) : 0,
  }));

  return sendSuccess(res, 200, "Category totals fetched successfully", result);
});

// @desc    Net balance over time
// @route   GET /api/dashboard/balance
// @access  Analyst + Admin
const getBalanceOverview = asyncHandler(async (req, res) => {
  const totalIncome = await Transaction.aggregate([
    { $match: { type: "income" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalExpense = await Transaction.aggregate([
    { $match: { type: "expense" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const income = totalIncome[0]?.total || 0;
  const expense = totalExpense[0]?.total || 0;
  const net = income - expense;

  return sendSuccess(res, 200, "Balance overview fetched successfully", {
    totalIncome: income,
    totalExpense: expense,
    netBalance: net,
    status: net >= 0 ? "surplus" : "deficit",
    savingsRate: income > 0 ? ((net / income) * 100).toFixed(1) : 0,
  });
});

module.exports = { getDashboardSummary, getTrends, getCategoryTotals, getBalanceOverview };
