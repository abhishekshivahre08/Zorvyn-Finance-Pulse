const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../utils/helpers");

// Protect routes - verify JWT token
const protect = asyncHandler(async(req, res, next) => {
    let token;
    console.log("Token Received:", token);


    // Get token from Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(
            new AppError("You are not logged in. Please login to get access.", 401)
        );
    }

    // Verify token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token Data:", decoded);
    } catch (err) {
        console.log("JWT Error:", err.message);
        if (err.name === "TokenExpiredError") {
            return next(new AppError("Your session has expired. Please login again.", 401));
        }
        return next(new AppError("Invalid token. Please login again.", 401));
    }

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError("The user belonging to this token no longer exists.", 401));
    }

    // Check if user is active
    if (currentUser.status === "inactive") {
        return next(new AppError("Your account has been deactivated. Contact admin.", 403));
    }

    // Grant access - attach user to request
    req.user = currentUser;
    next();
});

// Restrict to specific roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Access denied. Your role '${req.user.role}' does not have permission to perform this action.`,
                    403
                )
            );
        }
        next();
    };
};

// Optional auth - attaches user if token present, doesn't error if not
const optionalAuth = asyncHandler(async(req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
        } catch {
            // Invalid token - just continue without user
        }
    }
    next();
});

module.exports = { protect, restrictTo, optionalAuth };