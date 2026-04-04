const Joi = require("joi");

// Middleware that validates request body/query against a Joi schema
const validate = (schema, target = "body") => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[target], {
            abortEarly: false, // Return all errors at once
            stripUnknown: true, // Remove unknown fields silently
        });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message.replace(/['"]/g, ""),
            }));

            return res.status(400).json({
                success: false,
                message: "Validation failed. Please check the provided data.",
                errors,
            });
        }

        req[target] = value; // Replace with sanitized values
        next();
    };
};

// AUTH VALIDATORS 
const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
        "string.min": "Name must be at least 2 characters",
        "string.max": "Name cannot exceed 50 characters",
        "any.required": "Name is required",
    }),
    email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters",
        "any.required": "Password is required",
    }),
    role: Joi.string().valid("viewer", "analyst", "admin").default("viewer"),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
        "any.required": "Password is required",
    }),
});

//  USER VALIDATORS 
const updateUserSchema = Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    role: Joi.string().valid("viewer", "analyst", "admin"),
    status: Joi.string().valid("active", "inactive"),
    password: Joi.string().min(6),
}).min(1).messages({
    "object.min": "Please provide at least one field to update",
});

// TRANSACTION VALIDATORS
const INCOME_CATEGORIES = ["salary", "freelance", "investment", "business", "rental", "other_income"];
const EXPENSE_CATEGORIES = ["food", "housing", "transport", "utilities", "healthcare", "education", "entertainment", "shopping", "travel", "other_expense"];
const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const createTransactionSchema = Joi.object({
    title: Joi.string().min(2).max(100).required().messages({
        "string.min": "Title must be at least 2 characters",
        "string.max": "Title cannot exceed 100 characters",
        "any.required": "Title is required",
    }),
    amount: Joi.number().positive().required().messages({
        "number.positive": "Amount must be greater than 0",
        "any.required": "Amount is required",
    }),
    type: Joi.string().valid("income", "expense").required().messages({
        "any.only": "Type must be income or expense",
        "any.required": "Type is required",
    }),
    category: Joi.string().valid(...ALL_CATEGORIES).required().messages({
        "any.only": `Invalid category. Must be one of: ${ALL_CATEGORIES.join(", ")}`,
        "any.required": "Category is required",
    }),
    date: Joi.date().max("now").required().messages({
        "date.max": "Date cannot be in the future",
        "any.required": "Date is required",
    }),
    notes: Joi.string().max(500).allow("").optional(),
});

const updateTransactionSchema = Joi.object({
    title: Joi.string().min(2).max(100),
    amount: Joi.number().positive(),
    type: Joi.string().valid("income", "expense"),
    category: Joi.string().valid(...ALL_CATEGORIES),
    date: Joi.date().max("now"),
    notes: Joi.string().max(500).allow(""),
}).min(1).messages({
    "object.min": "Please provide at least one field to update",
});

const transactionQuerySchema = Joi.object({
    type: Joi.string().valid("income", "expense"),
    category: Joi.string().valid(...ALL_CATEGORIES),
    startDate: Joi.date(),
    endDate: Joi.date().when("startDate", {
        is: Joi.exist(),
        then: Joi.date().min(Joi.ref("startDate")).messages({
            "date.min": "End date must be after start date",
        }),
    }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid("date", "amount", "createdAt").default("date"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().max(100),
});

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    updateUserSchema,
    createTransactionSchema,
    updateTransactionSchema,
    transactionQuerySchema,
};