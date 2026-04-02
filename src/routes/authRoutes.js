const express = require("express");
const router = express.Router();
const { register, login, getMe, updatePassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate, registerSchema, loginSchema } = require("../validators/schemas");

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Protected routes
router.get("/me", protect, getMe);
router.patch("/update-password", protect, updatePassword);

module.exports = router;
