import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validateZodScheamas";
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  cancelPurchaseSchema,
  purchaseQuerySchema,
  purchaseParamsSchema,
  purchaseAnalyticsSchema,
} from "./purchase.validation";
import {
  createPurchase,
  getAllPurchases,
  getUserPurchases,
  getPurchaseById,
  updatePurchaseStatus,
  cancelPurchase,
  getPurchaseAnalytics,
  checkSubscriptionEligibility,
} from "./purchase.controller";

const router = Router();

// Specific routes first (before parameterized routes)
/**
 * @route   GET /api/v1/purchases/subscription-eligibility
 * @desc    Check if user can purchase a subscription
 * @access  Private (Authenticated users)
 */
router.get(
  "/subscription-eligibility",
  authenticate,
  checkSubscriptionEligibility,
);

/**
 * @route   GET /api/v1/purchases/my-purchases
 * @desc    Get current user's purchases
 * @access  Private (Authenticated users)
 */
router.get(
  "/my-purchases",
  authenticate,
  validateQuery(purchaseQuerySchema),
  getUserPurchases,
);

/**
 * @route   GET /api/v1/purchases/analytics
 * @desc    Get purchase analytics and statistics
 * @access  Private (Admin only)
 */
router.get(
  "/analytics",
  authenticate,
  authorize("admin"),
  validateQuery(purchaseAnalyticsSchema),
  getPurchaseAnalytics,
);

// Admin only routes
/**
 * @route   GET /api/v1/purchases
 * @desc    Get all purchases with filtering and pagination
 * @access  Private (Admin only)
 */
router.get(
  "/",
  authenticate,
  authorize("admin"),
  validateQuery(purchaseQuerySchema),
  getAllPurchases,
);

/**
 * @route   POST /api/v1/purchases
 * @desc    Create a new purchase
 * @access  Private (Authenticated users)
 */
router.post(
  "/",
  authenticate,
  validateBody(createPurchaseSchema),
  createPurchase,
);

/**
 * @route   GET /api/v1/purchases/:id
 * @desc    Get single purchase by ID
 * @access  Private (Purchase owner or Admin)
 */
router.get(
  "/:id",
  authenticate,
  validateParams(purchaseParamsSchema),
  getPurchaseById,
);

/**
 * @route   PUT /api/v1/purchases/:id/status
 * @desc    Update purchase status
 * @access  Private (Admin only)
 */
router.put(
  "/:id/status",
  authenticate,
  authorize("admin"),
  validateParams(purchaseParamsSchema),
  validateBody(updatePurchaseSchema),
  updatePurchaseStatus,
);

/**
 * @route   DELETE /api/v1/purchases/:id
 * @desc    Cancel a purchase
 * @access  Private (Purchase owner or Admin)
 */
router.delete(
  "/:id",
  authenticate,
  validateParams(purchaseParamsSchema),
  validateBody(cancelPurchaseSchema),
  cancelPurchase,
);

export default router;
