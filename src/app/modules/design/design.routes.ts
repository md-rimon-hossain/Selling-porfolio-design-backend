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

import multer from "multer";
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

// multer memory storage for file uploads (small/medium files). For large files consider direct uploads.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

// Create new design (Admin only)
// Accepts multipart/form-data with optional fields:
// - previewImages (array of image files)
// - files (array of downloadable files: zip/psd/pdf/etc)
router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  upload.fields([
    { name: "previewImages", maxCount: 5 },
    { name: "files", maxCount: 5 },
  ]),
  validateBody(createDesignSchema),
  createNewDesign,
);

// Update design (Admin only)
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(designParamsSchema),
  upload.fields([
    { name: "previewImages", maxCount: 5 },
    { name: "files", maxCount: 5 },
  ]),
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
