import express from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import {
  getUserProfile,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  changePassword,
} from "./user.controller";
import {
  validateQuery,
  validateParams,
  validateBody,
} from "../../middlewares/validateZodSchemas";
import {
  userQuerySchema,
  userParamsSchema,
  updateUserSchema,
  changePasswordSchema,
} from "./user.validation";

const router = express.Router();

// Get current user's profile (Authenticated users)
router.get("/myProfile", authenticate, getUserProfile);

// Change password (Authenticated users)
router.put(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  changePassword,
);

// Get all users (Admin only)
router.get(
  "/",
  authenticate,
  authorize("admin"),
  validateQuery(userQuerySchema),
  getAllUsers,
);

// Get single user by ID (Admin only)
router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(userParamsSchema),
  getSingleUser,
);

// Update user (Admin or user themselves)
router.put(
  "/:id",
  authenticate,
  validateParams(userParamsSchema),
  validateBody(updateUserSchema),
  updateUser,
);

// Delete user (Admin only)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(userParamsSchema),
  deleteUser,
);

export const userRoutes = router;
