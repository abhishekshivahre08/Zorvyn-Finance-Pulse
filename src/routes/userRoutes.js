const express = require("express");
const router = express.Router();
const {
  getAllUsers, getUserById, createUser, updateUser, deleteUser, getUserStats,
} = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/auth");
const { validate, registerSchema, updateUserSchema } = require("../validators/schemas");

// All user routes require authentication AND admin role
router.use(protect);
router.use(restrictTo("admin"));

router.get("/stats", getUserStats);
router.get("/", getAllUsers);
router.post("/", validate(registerSchema), createUser);
router.get("/:id", getUserById);
router.patch("/:id", validate(updateUserSchema), updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
