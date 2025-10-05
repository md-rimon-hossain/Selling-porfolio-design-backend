import express from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import {
  validateBody,
  validateParams,
} from "../../middlewares/validateZodScheamas";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
} from "./category.validation";
import {
  getAllCategories,
  getSingleCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller";

const router = express.Router();

// Get all categories (Public)
router.get("/", getAllCategories);

// Get single category by ID (Public)
router.get("/:id", validateParams(categoryParamsSchema), getSingleCategory);

// Create new category (Admin only)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(createCategorySchema),
  createCategory,
);

// Update category (Admin only)
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(categoryParamsSchema),
  validateBody(updateCategorySchema),
  updateCategory,
);

// Delete category (Admin only)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(categoryParamsSchema),
  deleteCategory,
);

export default router;
