import { Response } from "express";
import { Types } from "mongoose";
import { createPaymentSchema, refundPaymentSchema } from "./payment.validation";
import { PaymentServiceInstance } from "./payment.services";
import { AuthRequest } from "../../middlewares/auth";

/**
 * Create a new payment intent for any product type
 * Supports: designs, courses, subscriptions
 */
const createPaymentController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // Validate request body
    const parseResult = createPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.errors,
      });
      return;
    }

    const { productType, productId, currency } = parseResult.data;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Create payment intent
    const result = await PaymentServiceInstance.createPaymentIntentService(
      userId.toString(),
      productType,
      productId,
      currency,
    );

    res.status(200).json({
      success: true,
      message: "Payment intent created successfully",
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      },
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error creating payment:", err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to create payment",
    });
  }
};

/**
 * Get payment status by payment intent ID
 * Returns payment details including linked purchase if completed
 */
const getPaymentStatusController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      res.status(400).json({
        success: false,
        message: "Payment intent ID is required",
      });
      return;
    }

    const payment =
      await PaymentServiceInstance.getPaymentStatusService(paymentIntentId);

    // Check if user is authorized to view this payment
    // userId is populated, so we need to access _id if it's an object
    const paymentUserId =
      typeof payment.userId === "object" && payment.userId !== null
        ? (payment.userId as { _id: Types.ObjectId })._id.toString()
        : payment.userId.toString();

    if (
      req.user?.role !== "admin" &&
      paymentUserId !== req.user?._id?.toString()
    ) {
      res.status(403).json({
        success: false,
        message: "Not authorized to view this payment",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Payment status retrieved successfully",
      data: payment,
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error getting payment status:", err);
    res.status(500).json({
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to get payment status",
    });
  }
};

/**
 * Refund a payment (Admin only)
 * Creates refund on Stripe and updates Purchase record
 */
const refundPaymentController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // Check admin authorization
    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only admins can process refunds",
      });
      return;
    }

    // Validate request body
    const parseResult = refundPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.errors,
      });
      return;
    }

    const { paymentIntentId, amount, reason } = parseResult.data;

    // Process refund
    const result = await PaymentServiceInstance.refundPaymentService(
      paymentIntentId,
      amount,
      reason,
    );

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: {
        status: result.status,
        refundId: result.refundId,
      },
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error processing refund:", err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to process refund",
    });
  }
};

/**
 * Get user's payment history
 */
const getUserPaymentsController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const { Payment } = await import("./payment.model");

    const payments = await Payment.find({ userId })
      .populate("designId", "title basePrice previewImageUrls")
      .populate("courseId", "title basePrice thumbnailImageUrl")
      .populate("pricingPlanId", "name price duration")
      .populate("purchaseId")
      .sort({ createdAt: -1 })
      .limit(50)
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Payment history retrieved successfully",
      data: payments,
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error getting payment history:", err);
    res.status(500).json({
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to get payment history",
    });
  }
};

export const PaymentController = {
  createPaymentController,
  getPaymentStatusController,
  refundPaymentController,
  getUserPaymentsController,
};
