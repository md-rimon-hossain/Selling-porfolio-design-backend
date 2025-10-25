"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validateZodSchemas_1 = require("../../middlewares/validateZodSchemas");
const purchase_validation_1 = require("./purchase.validation");
const purchase_controller_1 = require("./purchase.controller");
const router = (0, express_1.Router)();
// Specific routes first (before parameterized routes)
/**
 * @route   GET /api/v1/purchases/subscription-eligibility
 * @desc    Check if user can purchase a subscription
 * @access  Private (Authenticated users)
 */
router.get("/subscription-eligibility", auth_1.authenticate, purchase_controller_1.checkSubscriptionEligibility);
/**
 * @route   GET /api/v1/purchases/my-purchases
 * @desc    Get current user's purchases
 * @access  Private (Authenticated users)
 */
router.get("/my-purchases", auth_1.authenticate, (0, validateZodSchemas_1.validateQuery)(purchase_validation_1.purchaseQuerySchema), purchase_controller_1.getUserPurchases);
/**
 * @route   GET /api/v1/purchases/analytics
 * @desc    Get purchase analytics and statistics
 * @access  Private (Admin only)
 */
router.get("/analytics", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateQuery)(purchase_validation_1.purchaseAnalyticsSchema), purchase_controller_1.getPurchaseAnalytics);
// Admin only routes
/**
 * @route   GET /api/v1/purchases
 * @desc    Get all purchases with filtering and pagination
 * @access  Private (Admin only)
 */
router.get("/", auth_1.authenticate, (0, auth_1.authorize)("admin"), purchase_controller_1.getAllPurchases);
/**
 * @route   POST /api/v1/purchases
 * @desc    Create a new purchase
 * @access  Private (Authenticated users)
 */
router.post("/", auth_1.authenticate, (0, validateZodSchemas_1.validateBody)(purchase_validation_1.createPurchaseSchema), purchase_controller_1.createPurchase);
/**
 * @route   GET /api/v1/purchases/:id
 * @desc    Get single purchase by ID
 * @access  Private (Purchase owner or Admin)
 */
router.get("/:id", auth_1.authenticate, (0, validateZodSchemas_1.validateParams)(purchase_validation_1.purchaseParamsSchema), purchase_controller_1.getPurchaseById);
/**
 * @route   PUT /api/v1/purchases/:id/status
 * @desc    Update purchase status
 * @access  Private (Admin only)
 */
router.put("/:id/status", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateParams)(purchase_validation_1.purchaseParamsSchema), (0, validateZodSchemas_1.validateBody)(purchase_validation_1.updatePurchaseSchema), purchase_controller_1.updatePurchaseStatus);
/**
 * @route   DELETE /api/v1/purchases/:id
 * @desc    Cancel a purchase
 * @access  Private (Purchase owner or Admin)
 */
router.delete("/:id", auth_1.authenticate, (0, validateZodSchemas_1.validateParams)(purchase_validation_1.purchaseParamsSchema), (0, validateZodSchemas_1.validateBody)(purchase_validation_1.cancelPurchaseSchema), purchase_controller_1.cancelPurchase);
exports.default = router;
