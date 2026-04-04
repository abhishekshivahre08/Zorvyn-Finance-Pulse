const { AppError } = require("../utils/helpers");

// Handle Mongoose CastError (invalid ObjectId)   Abhishek
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}. Please provide a valid ID.`;
    return new AppError(message, 400);
};

// Handle Mongoose Duplicate Key Error
const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists. Please use a different value.`;
    return new AppError(message, 409);
};

// Handle Mongoose Validation Error
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => ({
        field: el.path,
        message: el.message,
    }));
    return {
        statusCode: 400,
        message: "Validation failed",
        errors,
    };
};

// Handle JWT Errors
const handleJWTError = () =>
    new AppError("Invalid token. Please login again.", 401);

const handleJWTExpiredError = () =>
    new AppError("Your session has expired. Please login again.", 401);

// Development error response (detailed)
const sendErrorDev = (err, res) => {
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
        error: err,
        stack: err.stack,
    });
};

// Production error response (clean)
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    } else {
        console.error("💥 UNEXPECTED ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};

// Global Error Handler
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    // Development mode - full details
    if (process.env.NODE_ENV === "development") {
        return sendErrorDev(err, res);
    }

    // Production mode - handle specific error types
    let error = {...err };
    error.message = err.message;

    if (err.name === "CastError") error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

    if (err.name === "ValidationError") {
        const result = handleValidationErrorDB(err);
        return res.status(result.statusCode).json({
            success: false,
            message: result.message,
            errors: result.errors,
        });
    }

    sendErrorProd(error, res);
};

module.exports = globalErrorHandler;