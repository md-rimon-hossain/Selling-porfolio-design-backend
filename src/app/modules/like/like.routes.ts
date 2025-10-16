import express from "express";
import { authenticate, authorize } from "../../middlewares/auth";

import {
  validateParams,
  validateQuery,
} from "../../middlewares/validateZodSchemas";
import { likeParamsSchema, likeQuerySchema } from "./like.validation";

import {
  toggleLikeDesign,
  getUserLikedDesigns,
  checkIfUserLikedDesign,
  getDesignLikers,
} from "./like.controller";

const router = express.Router();

/**
 * @route   POST /api/likes/:designId
 * @desc    Toggle like/unlike on a design
 * @access  Private (Authenticated users)
 */
router.post(
  "/:designId",
  authenticate,
  validateParams(likeParamsSchema),
  toggleLikeDesign,
);

/**
 * @route   GET /api/likes/my-likes
 * @desc    Get current user's liked designs
 * @access  Private (Authenticated users)
 */
router.get(
  "/my-likes",
  authenticate,
  validateQuery(likeQuerySchema),
  getUserLikedDesigns,
);

/**
 * @route   GET /api/likes/:designId/check
 * @desc    Check if current user liked a specific design
 * @access  Private (Authenticated users)
 */

router.get(
  "/:designId/check",
  authenticate,
  validateParams(likeParamsSchema),
  checkIfUserLikedDesign,
);

/**
 * @route   GET /api/likes/:designId/likers
 * @desc    Get all users who liked a specific design
 * @access  Private (Admin only)
 */
router.get(
  "/:designId/likers",
  authenticate,
  authorize("admin"),
  validateParams(likeParamsSchema),
  validateQuery(likeQuerySchema),
  getDesignLikers,
);

export default router;


