import express from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validateZodSchemas";

import {
  createDesignSchema,
  updateDesignSchema,
  designParamsSchema,
  designQuerySchema,
} from "./design.validation";

import {
  createNewDesign,
  getAllDesigns,
  getSingleDesign,
  updateDesign,
  deleteDesign,
} from "./design.controller";

const router = express.Router();

// Get all designs (Public - anyone can see)
router.get("/", validateQuery(designQuerySchema), getAllDesigns);

// Get single design by ID (Public)
router.get("/:id", validateParams(designParamsSchema), getSingleDesign);

// Create new design (Admin only)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(createDesignSchema),
  createNewDesign,
);

// Update design (Admin only)
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(designParamsSchema),
  validateBody(updateDesignSchema),
  updateDesign,
);

// Delete design (Admin only)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(designParamsSchema),
  deleteDesign,
);

export default router;
