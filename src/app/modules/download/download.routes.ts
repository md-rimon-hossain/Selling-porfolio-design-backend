import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import {
  validateParams,
  validateQuery,
} from "../../middlewares/validateZodScheamas";
import {
  downloadDesignSchema,
  downloadQuerySchema,
  downloadAnalyticsSchema,
} from "./download.validation";
import {
  downloadDesign,
  getUserDownloads,
  getUserSubscriptionStatus,
  getDownloadAnalytics,
} from "./download.controller";

const router = Router();

// User routes (require authentication)
/**
 * @route   GET /api/v1/downloads/subscription-status
 * @desc    Get user's current subscription status
 * @access  Private (Authenticated users)
 */
router.get("/subscription-status", authenticate, getUserSubscriptionStatus);

/**
 * @route   GET /api/v1/downloads/my-downloads
 * @desc    Get user's download history
 * @access  Private (Authenticated users)
 */
router.get(
  "/my-downloads",
  authenticate,
  validateQuery(downloadQuerySchema),
  getUserDownloads,
);

/**
 * @route   POST /api/v1/downloads/design/:designId
 * @desc    Download a design (individual purchase or subscription)
 * @access  Private (Authenticated users)
 */
router.post(
  "/design/:designId",
  authenticate,
  validateParams(downloadDesignSchema),
  downloadDesign,
);

// Admin routes
/**
 * @route   GET /api/v1/downloads/analytics
 * @desc    Get download analytics and statistics
 * @access  Private (Admin only)
 */
router.get(
  "/analytics",
  authenticate,
  authorize("admin"),
  validateQuery(downloadAnalyticsSchema),
  getDownloadAnalytics,
);

export default router;
