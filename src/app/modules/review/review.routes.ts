import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validateZodScheamas";
import {
  createReviewSchema,
  updateReviewSchema,
  reviewQuerySchema,
  reviewParamsSchema,
  designReviewsParamsSchema,
  reviewHelpfulnessSchema,
  reviewAnalyticsSchema,
} from "./review.validation";
import {
  createReview,
  getAllReviews,
  getDesignReviews,
  getReviewById,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getReviewAnalytics,
} from "./review.controller";

const router = Router();

// Public routes
/**
 * @route   GET /api/v1/reviews/design/:designId
 * @desc    Get all reviews for a specific design (public)
 * @access  Public
 */
router.get(
  "/design/:designId",
  validateParams(designReviewsParamsSchema),
  validateQuery(reviewQuerySchema),
  getDesignReviews,
);

/**
 * @route   GET /api/v1/reviews/:id
 * @desc    Get single review by ID
 * @access  Public
 */
router.get("/:id", validateParams(reviewParamsSchema), getReviewById);

// Protected routes (require authentication)
/**
 * @route   POST /api/v1/reviews
 * @desc    Create a new review
 * @access  Private (Authenticated users)
 */
router.post("/", authenticate, validateBody(createReviewSchema), createReview);

/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update review (only by review author)
 * @access  Private (Review author or Admin)
 */
router.put(
  "/:id",
  authenticate,
  validateParams(reviewParamsSchema),
  validateBody(updateReviewSchema),
  updateReview,
);

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete review (only by review author or admin)
 * @access  Private (Review author or Admin)
 */
router.delete(
  "/:id",
  authenticate,
  validateParams(reviewParamsSchema),
  deleteReview,
);

/**
 * @route   PUT /api/v1/reviews/:id/helpful
 * @desc    Mark review as helpful/unhelpful
 * @access  Private (Authenticated users, not review author)
 */
router.put(
  "/:id/helpful",
  authenticate,
  validateParams(reviewParamsSchema),
  validateBody(reviewHelpfulnessSchema),
  markReviewHelpful,
);

// Admin only routes
/**
 * @route   GET /api/v1/reviews
 * @desc    Get all reviews with filtering and pagination
 * @access  Private (Admin only)
 */
router.get(
  "/",
  authenticate,
  authorize("admin"),
  validateQuery(reviewQuerySchema),
  getAllReviews,
);

/**
 * @route   GET /api/v1/reviews/analytics/overview
 * @desc    Get review analytics and statistics
 * @access  Private (Admin only)
 */
router.get(
  "/analytics/overview",
  authenticate,
  authorize("admin"),
  validateQuery(reviewAnalyticsSchema),
  getReviewAnalytics,
);

export default router;
