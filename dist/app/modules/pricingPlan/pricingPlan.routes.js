"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validateZodSchemas_1 = require("../../middlewares/validateZodSchemas");
const pricingPlan_validation_1 = require("./pricingPlan.validation");
const pricingPlan_controller_1 = require("./pricingPlan.controller");
const router = (0, express_1.Router)();
// Public routes
/**
 * @route   GET /api/v1/pricing-plans/active
 * @desc    Get all active pricing plans (public)
 * @access  Public
 */
router.get("/active", pricingPlan_controller_1.getActivePricingPlans);
/**
 * @route   GET /api/v1/pricing-plans/:id
 * @desc    Get single pricing plan by ID
 * @access  Public
 */
router.get("/:id", (0, validateZodSchemas_1.validateParams)(pricingPlan_validation_1.pricingPlanParamsSchema), pricingPlan_controller_1.getPricingPlanById);
// Protected routes (require authentication)
/**
 * @route   GET /api/v1/pricing-plans
 * @desc    Get all pricing plans with filtering and pagination
 * @access  Private (Admin only for full details)
 */
router.get("/", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateQuery)(pricingPlan_validation_1.pricingPlanQuerySchema), pricingPlan_controller_1.getAllPricingPlans);
// Admin only routes
/**
 * @route   POST /api/v1/pricing-plans
 * @desc    Create a new pricing plan
 * @access  Private (Admin only)
 */
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateBody)(pricingPlan_validation_1.createPricingPlanSchema), pricingPlan_controller_1.createPricingPlan);
/**
 * @route   PUT /api/v1/pricing-plans/:id
 * @desc    Update pricing plan
 * @access  Private (Admin only)
 */
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateParams)(pricingPlan_validation_1.pricingPlanParamsSchema), (0, validateZodSchemas_1.validateBody)(pricingPlan_validation_1.updatePricingPlanSchema), pricingPlan_controller_1.updatePricingPlan);
/**
 * @route   DELETE /api/v1/pricing-plans/:id
 * @desc    Delete pricing plan (soft delete by default, permanent with ?permanent=true)
 * @access  Private (Admin only)
 */
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateParams)(pricingPlan_validation_1.pricingPlanParamsSchema), pricingPlan_controller_1.deletePricingPlan);
/**
 * @route   GET /api/v1/pricing-plans/analytics/overview
 * @desc    Get pricing plan analytics and statistics
 * @access  Private (Admin only)
 */
router.get("/analytics/overview", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateQuery)(pricingPlan_validation_1.pricingPlanAnalyticsSchema), pricingPlan_controller_1.getPricingPlanAnalytics);
exports.default = router;
