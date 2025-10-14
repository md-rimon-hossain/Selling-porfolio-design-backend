import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validateZodSchemas";

import {
  createPricingPlanSchema,
  updatePricingPlanSchema,
  pricingPlanQuerySchema,
  pricingPlanParamsSchema,
  pricingPlanAnalyticsSchema,
} from "./pricingPlan.validation";

import {
  createPricingPlan,
  getAllPricingPlans,
  getActivePricingPlans,
  getPricingPlanById,
  updatePricingPlan,
  deletePricingPlan,
  getPricingPlanAnalytics,
} from "./pricingPlan.controller";

const router = Router();

// Public routes
/**
 * @route   GET /api/v1/pricing-plans/active
 * @desc    Get all active pricing plans (public)
 * @access  Public
 */
router.get("/active", getActivePricingPlans);

/**
 * @route   GET /api/v1/pricing-plans/:id
 * @desc    Get single pricing plan by ID
 * @access  Public
 */
router.get("/:id", validateParams(pricingPlanParamsSchema), getPricingPlanById);

// Protected routes (require authentication)
/**
 * @route   GET /api/v1/pricing-plans
 * @desc    Get all pricing plans with filtering and pagination
 * @access  Private (Admin only for full details)
 */
router.get(
  "/",
  authenticate,
  authorize("admin"),
  validateQuery(pricingPlanQuerySchema),
  getAllPricingPlans,
);

// Admin only routes
/**
 * @route   POST /api/v1/pricing-plans
 * @desc    Create a new pricing plan
 * @access  Private (Admin only)
 */
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(createPricingPlanSchema),
  createPricingPlan,
);

/**
 * @route   PUT /api/v1/pricing-plans/:id
 * @desc    Update pricing plan
 * @access  Private (Admin only)
 */
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(pricingPlanParamsSchema),
  validateBody(updatePricingPlanSchema),
  updatePricingPlan,
);

/**
 * @route   DELETE /api/v1/pricing-plans/:id
 * @desc    Delete pricing plan (soft delete by default, permanent with ?permanent=true)
 * @access  Private (Admin only)
 */
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(pricingPlanParamsSchema),
  deletePricingPlan,
);

/**
 * @route   GET /api/v1/pricing-plans/analytics/overview
 * @desc    Get pricing plan analytics and statistics
 * @access  Private (Admin only)
 */
router.get(
  "/analytics/overview",
  authenticate,
  authorize("admin"),
  validateQuery(pricingPlanAnalyticsSchema),
  getPricingPlanAnalytics,
);

export default router;
