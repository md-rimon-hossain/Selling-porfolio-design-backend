"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validateZodSchemas_1 = require("../../middlewares/validateZodSchemas");
const review_validation_1 = require("./review.validation");
const review_controller_1 = require("./review.controller");
const router = (0, express_1.Router)();
// Public routes
/**
 * @route   GET /api/v1/reviews/design/:designId
 * @desc    Get all reviews for a specific design (public)
 * @access  Public
 */
router.get("/design/:designId", (0, validateZodSchemas_1.validateParams)(review_validation_1.designReviewsParamsSchema), (0, validateZodSchemas_1.validateQuery)(review_validation_1.reviewQuerySchema), review_controller_1.getSingleDesignReviews);
/**
 * @route   GET /api/v1/reviews/:id
 * @desc    Get single review by ID
 * @access  Public
 */
router.get("/:id", (0, validateZodSchemas_1.validateParams)(review_validation_1.reviewParamsSchema), review_controller_1.getReviewById);
// Protected routes (require authentication)
/**
 * @route   POST /api/v1/reviews
 * @desc    Create a new review
 * @access  Private (Authenticated users)
 */
router.post("/", auth_1.authenticate, (0, validateZodSchemas_1.validateBody)(review_validation_1.createReviewSchema), review_controller_1.createReview);
/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update review (only by review author)
 * @access  Private (Review author or Admin)
 */
router.put("/:id", auth_1.authenticate, (0, validateZodSchemas_1.validateParams)(review_validation_1.reviewParamsSchema), (0, validateZodSchemas_1.validateBody)(review_validation_1.updateReviewSchema), review_controller_1.updateReview);
/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete review (only by review author or admin)
 * @access  Private (Review author or Admin)
 */
router.delete("/:id", auth_1.authenticate, (0, validateZodSchemas_1.validateParams)(review_validation_1.reviewParamsSchema), review_controller_1.deleteReview);
/**
 * @route   PUT /api/v1/reviews/:id/helpful
 * @desc    Mark review as helpful/unhelpful
 * @access  Private (Authenticated users, not review author)
 */
router.put("/:id/helpful", auth_1.authenticate, (0, validateZodSchemas_1.validateParams)(review_validation_1.reviewParamsSchema), (0, validateZodSchemas_1.validateBody)(review_validation_1.reviewHelpfulnessSchema), review_controller_1.markReviewHelpful);
// Admin only routes
/**
 * @route   GET /api/v1/reviews
 * @desc    Get all reviews with filtering and pagination
 * @access  Private (Admin only)
 */
router.get("/", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateQuery)(review_validation_1.reviewQuerySchema), review_controller_1.getAllReviews);
/**
 * @route   GET /api/v1/reviews/analytics/overview
 * @desc    Get review analytics and statistics
 * @access  Private (Admin only)
 */
router.get("/analytics/overview", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateQuery)(review_validation_1.reviewAnalyticsSchema), review_controller_1.getReviewAnalytics);
exports.default = router;
