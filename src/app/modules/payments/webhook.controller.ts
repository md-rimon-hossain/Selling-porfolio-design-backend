import { Request, Response } from "express";
import Stripe from "stripe";
import { PaymentServiceInstance } from "./payment.services";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

/**
 * Handle Stripe webhook events
 * This endpoint receives notifications from Stripe when payment events occur
 * IMPORTANT: This route needs raw body, not JSON parsed body
 */
const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(400).json({ success: false, message: "No signature provided" });
    return;
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature to ensure request is from Stripe
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("⚠️ Webhook signature verification failed:", err);
    res.status(400).json({
      success: false,
      message: `Webhook Error: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    return;
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // eslint-disable-next-line no-console
        console.log(`💰 Payment succeeded: ${paymentIntent.id}`);

        // Confirm payment and create purchase record
        const result = await PaymentServiceInstance.confirmPaymentService(
          paymentIntent.id,
        );

        // eslint-disable-next-line no-console
        console.log(`✅ Purchase created: ${result.purchaseId || "N/A"}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // eslint-disable-next-line no-console
        console.log(`❌ Payment failed: ${paymentIntent.id}`);

        // Update payment status to failed
        await PaymentServiceInstance.confirmPaymentService(paymentIntent.id);
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // eslint-disable-next-line no-console
        console.log(`🚫 Payment canceled: ${paymentIntent.id}`);

        // Update payment status to canceled
        await PaymentServiceInstance.confirmPaymentService(paymentIntent.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        // eslint-disable-next-line no-console
        console.log(`💸 Refund processed for charge: ${charge.id}`);

        // Refund is already handled by refundPaymentService
        // This event is just for logging/notification purposes
        break;
      }

      default:
        // eslint-disable-next-line no-console
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Respond to Stripe that webhook was received successfully
    res.json({ received: true, eventType: event.type });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`❌ Error processing webhook event ${event.type}:`, error);

    // Still respond with 200 to acknowledge receipt
    // Stripe will retry if we respond with error
    res.json({
      received: true,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const WebhookController = {
  handleWebhook,
};
