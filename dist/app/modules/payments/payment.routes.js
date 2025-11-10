"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const payment_controller_1 = require("./payment.controller");
const webhook_controller_1 = require("./webhook.controller");
const router = (0, express_1.Router)();
/**
 * PUBLIC ROUTE - Stripe Webhook
 * IMPORTANT: This must be registered BEFORE express.json() middleware in app.ts
 * Stripe sends raw body for signature verification
 */
router.post("/webhook", webhook_controller_1.WebhookController.handleWebhook);
/**
 * PROTECTED ROUTES - Require authentication
 */
// Create a new payment intent for designs, courses, or subscriptions
router.post("/create", auth_1.authenticate, payment_controller_1.PaymentController.createPaymentController);
// Get payment status by payment intent ID
router.get("/status/:paymentIntentId", auth_1.authenticate, payment_controller_1.PaymentController.getPaymentStatusController);
// Get user's payment history
router.get("/my-payments", auth_1.authenticate, payment_controller_1.PaymentController.getUserPaymentsController);
/**
 * ADMIN ONLY ROUTES
 */
// Get all payments with filters (admin only)
router.get("/admin/all", auth_1.authenticate, (0, auth_1.authorize)("admin"), payment_controller_1.PaymentController.getAllPaymentsController);
// Get payment statistics and analytics (admin only)
router.get("/admin/statistics", auth_1.authenticate, (0, auth_1.authorize)("admin"), payment_controller_1.PaymentController.getPaymentStatisticsController);
// Process refund (admin only)
router.post("/refund", auth_1.authenticate, (0, auth_1.authorize)("admin"), payment_controller_1.PaymentController.refundPaymentController);
exports.PaymentRoutes = router;
