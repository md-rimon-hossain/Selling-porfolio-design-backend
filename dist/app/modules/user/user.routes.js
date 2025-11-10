"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const user_controller_1 = require("./user.controller");
const validateZodSchemas_1 = require("../../middlewares/validateZodSchemas");
const user_validation_1 = require("./user.validation");
const router = express_1.default.Router();
// Get current user's profile (Authenticated users)
router.get("/myProfile", auth_1.authenticate, user_controller_1.getUserProfile);
// Change password (Authenticated users)
router.put("/change-password", auth_1.authenticate, (0, validateZodSchemas_1.validateBody)(user_validation_1.changePasswordSchema), user_controller_1.changePassword);
// Get all users (Admin only)
router.get("/", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateQuery)(user_validation_1.userQuerySchema), user_controller_1.getAllUsers);
// Get single user by ID (Admin only)
router.get("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateParams)(user_validation_1.userParamsSchema), user_controller_1.getSingleUser);
// Update user (Admin or user themselves)
router.put("/:id", auth_1.authenticate, (0, validateZodSchemas_1.validateParams)(user_validation_1.userParamsSchema), (0, validateZodSchemas_1.validateBody)(user_validation_1.updateUserSchema), user_controller_1.updateUser);
// Delete user (Admin only)
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateParams)(user_validation_1.userParamsSchema), user_controller_1.deleteUser);
exports.userRoutes = router;
