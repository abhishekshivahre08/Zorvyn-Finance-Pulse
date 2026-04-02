require("dotenv").config();
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const connectDB = require("./config/database");
const globalErrorHandler = require("./middleware/errorHandler");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");
const { AppError } = require("./utils/helpers");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// ─── Connect Database ────────────────────────────────────────────
connectDB();

// ─── Security Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Request Logging ─────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
} else {
    app.use(morgan("combined"));
}

// ─── Body Parsers ────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // Limit body size to 10kb
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Rate Limiting ───────────────────────────────────────────────
app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ─── Health Check ────────────────────────────────────────────────
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Finance Dashboard API is running",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});

// ─── API Info ────────────────────────────────────────────────────
app.get("/api", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Finance Dashboard API",
        version: "1.0.0",
        endpoints: {
            auth: {
                "POST /api/auth/register": "Register new user",
                "POST /api/auth/login": "Login user",
                "GET /api/auth/me": "Get current user profile [Protected]",
                "PATCH /api/auth/update-password": "Update password [Protected]",
            },
            users: {
                "GET /api/users": "Get all users [Admin]",
                "GET /api/users/stats": "Get user statistics [Admin]",
                "POST /api/users": "Create user [Admin]",
                "GET /api/users/:id": "Get user by ID [Admin]",
                "PATCH /api/users/:id": "Update user [Admin]",
                "DELETE /api/users/:id": "Deactivate user [Admin]",
            },
            transactions: {
                "GET /api/transactions": "Get all transactions [All Roles]",
                "GET /api/transactions/:id": "Get transaction by ID [All Roles]",
                "POST /api/transactions": "Create transaction [Admin]",
                "PATCH /api/transactions/:id": "Update transaction [Admin]",
                "DELETE /api/transactions/:id": "Soft delete transaction [Admin]",
                "PATCH /api/transactions/:id/restore": "Restore deleted transaction [Admin]",
            },
            dashboard: {
                "GET /api/dashboard/summary": "Full dashboard summary [Analyst, Admin]",
                "GET /api/dashboard/trends": "Monthly/weekly trends [Analyst, Admin]",
                "GET /api/dashboard/categories": "Category-wise totals [Analyst, Admin]",
                "GET /api/dashboard/balance": "Net balance overview [Analyst, Admin]",
            },
        },
        queryParams: {
            transactions: "type, category, startDate, endDate, page, limit, sortBy, sortOrder, search",
            dashboard: "period (week|month|quarter|year)",
            trends: "groupBy (month|week), months",
        },
    });
});

// ─── API Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ─── Serve Frontend (if built) ───────────────────────────────────
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/build")));
    app.get("*", (req, res) => {
        if (!req.path.startsWith("/api")) {
            res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
        }
    });
}

// ─── 404 Handler ─────────────────────────────────────────────────
app.all("*", (req, res, next) => {
    next(new AppError(`Route '${req.originalUrl}' not found on this server.`, 404));
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use(globalErrorHandler);

// ─── Start Server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀  Finance Dashboard API Server Started");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📡  Server     : http://localhost:${PORT}`);
    console.log(`📋  API Docs   : http://localhost:${PORT}/api`);
    console.log(`❤️   Health     : http://localhost:${PORT}/health`);
    console.log(`🌍  Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});

// ─── Graceful Shutdown ────────────────────────────────────────────
process.on("SIGTERM", () => {
    console.log("⚠️  SIGTERM received. Shutting down gracefully...");
    server.close(() => {
        console.log("✅ Server closed. Bye!");
        process.exit(0);
    });
});

process.on("unhandledRejection", (err) => {
    console.error("💥 Unhandled Promise Rejection:", err.name, err.message);
    server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught Exception:", err.name, err.message);
    process.exit(1);
});

module.exports = app;