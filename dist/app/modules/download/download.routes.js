"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validateZodSchemas_1 = require("../../middlewares/validateZodSchemas");
const download_validation_1 = require("./download.validation");
const download_controller_1 = require("./download.controller");
const router = (0, express_1.Router)();
// Admin routes
/**
 * @route   GET /api/v1/downloads
 * @desc    Get all downloads with advanced filters (Admin only)
 * @access  Private (Admin only)
 */
router.get("/", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateQuery)(download_validation_1.adminDownloadQuerySchema), download_controller_1.getAllDownloads);
/**
 * @route   GET /api/v1/downloads/analytics
 * @desc    Get download analytics and statistics
 * @access  Private (Admin only)
 */
router.get("/analytics", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateQuery)(download_validation_1.downloadAnalyticsSchema), download_controller_1.getDownloadAnalytics);
// User routes (require authentication)
/**
 * @route   GET /api/v1/downloads/subscription-status
 * @desc    Get user's current subscription status
 * @access  Private (Authenticated users)
 */
router.get("/subscription-status", auth_1.authenticate, download_controller_1.getUserSubscriptionStatus);
/**
 * @route   GET /api/v1/downloads/my-downloads
 * @desc    Get user's download history
 * @access  Private (Authenticated users)
 */
router.get("/my-downloads", auth_1.authenticate, (0, validateZodSchemas_1.validateQuery)(download_validation_1.downloadQuerySchema), download_controller_1.getUserDownloads);
/**
 * @route   POST /api/v1/downloads/design/:designId
 * @desc    Download a design (individual purchase or subscription)
 * @access  Private (Authenticated users)
 */
router.post("/design/:designId", auth_1.authenticate, (0, validateZodSchemas_1.validateParams)(download_validation_1.downloadDesignSchema), download_controller_1.downloadDesignFile);
exports.default = router;
