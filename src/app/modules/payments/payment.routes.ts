import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { PaymentController } from "./payment.controller";
import { WebhookController } from "./webhook.controller";

const router = Router();

/**
 * PUBLIC ROUTE - Stripe Webhook
 * IMPORTANT: This must be registered BEFORE express.json() middleware in app.ts
 * Stripe sends raw body for signature verification
 */
router.post("/webhook", WebhookController.handleWebhook);

/**
 * PROTECTED ROUTES - Require authentication
 */

// Create a new payment intent for designs, courses, or subscriptions
router.post("/create", authenticate, PaymentController.createPaymentController);

// Get payment status by payment intent ID
router.get(
  "/status/:paymentIntentId",
  authenticate,
  PaymentController.getPaymentStatusController,
);

// Get user's payment history
router.get(
  "/my-payments",
  authenticate,
  PaymentController.getUserPaymentsController,
);

/**
 * ADMIN ONLY ROUTES
 */

// Process refund (admin only)
router.post(
  "/refund",
  authenticate,
  authorize("admin"),
  PaymentController.refundPaymentController,
);

export const PaymentRoutes = router;
