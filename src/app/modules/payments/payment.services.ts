// src/app/modules/payments/payment.service.ts
import Stripe from "stripe";
import { Types, startSession } from "mongoose";
import { Payment } from "./payment.model";
import { Purchase } from "../purchase/purchase.model";
import { Design } from "../design/design.model";
import { Course } from "../course/course.model";
import { PricingPlan } from "../pricingPlan/pricingPlan.model";
import { IPaymentModule } from "./payment.interface";

// Stripe initialization with latest API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

/**
 * Create a payment intent and save payment record
 * Validates product exists and is available for purchase
 */
const createPaymentIntentService = async (
  userId: string,
  productType: "design" | "course" | "subscription",
  productId: string,
  currency: string = "USD",
): Promise<{ clientSecret: string | null; paymentIntentId: string }> => {
  // Validate inputs
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid user ID or product ID");
  }

  let amount = 0;
  let productName = "";
  const productData: Record<string, unknown> = {};

  // Validate product exists and get amount
  switch (productType) {
    case "design": {
      const design = await Design.findById(productId);
      if (!design || design.status !== "Active") {
        throw new Error("Design not found or not available for purchase");
      }
      amount = Math.round((design.discountedPrice || design.basePrice) * 100); // Convert to cents
      productName = design.title;
      productData.designId = productId;
      break;
    }

    case "course": {
      const course = await Course.findById(productId);
      if (!course || course.status !== "Active") {
        throw new Error("Course not found or not available for purchase");
      }
      amount = Math.round((course.discountedPrice || course.basePrice) * 100);
      productName = course.title;
      productData.courseId = productId;
      break;
    }

    case "subscription": {
      const plan = await PricingPlan.findById(productId);
      if (!plan || !plan.isActive) {
        throw new Error("Pricing plan not found or not available");
      }
      if (plan.validUntil && new Date() > plan.validUntil) {
        throw new Error("Pricing plan has expired");
      }
      amount = Math.round((plan.finalPrice || plan.price) * 100);
      productName = plan.name;
      productData.pricingPlanId = productId;
      break;
    }

    default:
      throw new Error("Invalid product type");
  }

  if (amount <= 0) {
    throw new Error("Invalid amount: must be greater than 0");
  }

  try {
    // Check for duplicate pending payment
    const existingPendingPayment = await Payment.findOne({
      userId,
      productType,
      ...productData,
      status: "pending",
    });

    if (existingPendingPayment) {
      // Return existing payment intent if still valid
      const existingIntent = await stripe.paymentIntents.retrieve(
        existingPendingPayment.paymentIntentId,
      );

      if (
        existingIntent.status === "requires_payment_method" ||
        existingIntent.status === "requires_confirmation"
      ) {
        return {
          clientSecret: existingIntent.client_secret,
          paymentIntentId: existingIntent.id,
        };
      }
    }

    // Create new PaymentIntent on Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      payment_method_types: ["card"],
      metadata: {
        userId,
        productType,
        productId,
        productName,
      },
    });

    // Save payment record in MongoDB
    await Payment.create({
      userId,
      productType,
      ...productData,
      amount: amount / 100, // Store in dollars, not cents
      currency: currency.toUpperCase(),
      status: "pending",
      paymentIntentId: paymentIntent.id,
    } as IPaymentModule["paymentRecord"]);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create payment intent:", error);
    throw new Error(
      `Failed to create payment intent: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

/**
 * Confirm payment after successful charge
 * Creates Purchase record and grants access
 * Uses MongoDB transaction for atomicity
 */
const confirmPaymentService = async (
  paymentIntentId: string,
): Promise<{ status: string; purchaseId?: string }> => {
  const session = await startSession();
  session.startTransaction();

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Find payment record
    const payment = await Payment.findOne({ paymentIntentId }).session(session);
    if (!payment) {
      throw new Error("Payment record not found");
    }

    // Check if already processed
    if (payment.status === "succeeded" && payment.purchaseId) {
      await session.abortTransaction();
      return {
        status: paymentIntent.status,
        purchaseId: payment.purchaseId.toString(),
      };
    }

    // Update payment status
    const updateData: Partial<IPaymentModule["paymentRecord"]> = {
      status: paymentIntent.status as "pending" | "succeeded" | "failed",
      paymentMethod: paymentIntent.payment_method?.toString(),
    };

    if (paymentIntent.status === "succeeded") {
      updateData.succeededAt = new Date();

      // Helper function to get currency symbol
      const getCurrencySymbol = (currency: string): string => {
        const symbols: Record<string, string> = {
          BDT: "৳",
          USD: "$",
          EUR: "€",
          GBP: "£",
          JPY: "¥",
          INR: "₹",
          CAD: "$",
          AUD: "$",
        };
        return symbols[currency.toUpperCase()] || "$";
      };

      // Create Purchase record
      const purchaseData: Record<string, unknown> = {
        user: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        currencyDisplay: getCurrencySymbol(payment.currency),
        paymentMethod: "stripe",
        status: "completed",
        purchaseDate: new Date(),
        activatedAt: new Date(),
        paymentDetails: {
          paymentIntentId: paymentIntent.id,
          paymentMethod: paymentIntent.payment_method,
        },
        // Stripe-specific fields for direct reference
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: paymentIntent.customer?.toString(),
      };

      // Set purchase type and product reference
      if (payment.productType === "subscription") {
        purchaseData.purchaseType = "subscription";
        purchaseData.pricingPlan = payment.pricingPlanId;

        // Calculate subscription dates
        const plan = await PricingPlan.findById(payment.pricingPlanId).session(
          session,
        );
        if (plan) {
          const startDate = new Date();
          const endDate = new Date(startDate);

          const duration = plan.duration.toLowerCase();
          if (duration.includes("month")) {
            const months = parseInt(duration.match(/\d+/)?.[0] || "1");
            endDate.setMonth(endDate.getMonth() + months);
          } else if (duration.includes("year")) {
            const years = parseInt(duration.match(/\d+/)?.[0] || "1");
            endDate.setFullYear(endDate.getFullYear() + years);
          } else {
            endDate.setMonth(endDate.getMonth() + 1);
          }

          purchaseData.subscriptionStartDate = startDate;
          purchaseData.subscriptionEndDate = endDate;
          purchaseData.remainingDownloads = plan.maxDownloads || 999999;
          purchaseData.itemMaxDownloads = plan.maxDownloads || 999999; // Track original max downloads
        }
      } else {
        purchaseData.purchaseType = "individual";
        if (payment.productType === "design") {
          purchaseData.design = payment.designId;
        } else if (payment.productType === "course") {
          purchaseData.course = payment.courseId;
        }
      }

      // Create purchase
      const purchase = await Purchase.create([purchaseData], { session });
      updateData.purchaseId = purchase[0]._id;

      // Update payment with purchase reference
      await Payment.findByIdAndUpdate(payment._id, updateData, {
        session,
        new: true,
      });

      await session.commitTransaction();

      return {
        status: paymentIntent.status,
        purchaseId: purchase[0]._id.toString(),
      };
    } else if (
      paymentIntent.status === "canceled" ||
      paymentIntent.status.includes("failed")
    ) {
      updateData.failedAt = new Date();
      updateData.errorMessage = paymentIntent.last_payment_error?.message;

      await Payment.findByIdAndUpdate(payment._id, updateData, { session });
      await session.commitTransaction();

      return { status: paymentIntent.status };
    }

    // Update payment status
    await Payment.findByIdAndUpdate(payment._id, updateData, { session });
    await session.commitTransaction();

    return { status: paymentIntent.status };
  } catch (error) {
    await session.abortTransaction();
    // eslint-disable-next-line no-console
    console.error("Failed to confirm payment:", error);
    throw new Error(
      `Failed to confirm payment: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    session.endSession();
  }
};

/**
 * Refund a payment and update Purchase record
 */
const refundPaymentService = async (
  paymentIntentId: string,
  amount?: number,
  reason?: string,
): Promise<{ status: string; refundId: string }> => {
  const session = await startSession();
  session.startTransaction();

  try {
    // Find payment record
    const payment = await Payment.findOne({ paymentIntentId }).session(session);
    if (!payment) {
      throw new Error("Payment record not found");
    }

    if (payment.status !== "succeeded") {
      throw new Error("Only succeeded payments can be refunded");
    }

    // Create refund on Stripe
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason:
        (reason as Stripe.RefundCreateParams.Reason) || "requested_by_customer",
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to cents
    }

    const refund = await stripe.refunds.create(refundData);

    // Update payment status
    await Payment.findByIdAndUpdate(
      payment._id,
      {
        status: "refunded",
        refundedAt: new Date(),
      },
      { session },
    );

    // Update purchase status
    if (payment.purchaseId) {
      await Purchase.findByIdAndUpdate(
        payment.purchaseId,
        {
          status: "refunded",
          adminNotes: `Refund processed: ${reason || "No reason provided"}`,
        },
        { session },
      );
    }

    await session.commitTransaction();

    return {
      status: refund.status || "succeeded",
      refundId: refund.id,
    };
  } catch (error) {
    await session.abortTransaction();
    // eslint-disable-next-line no-console
    console.error("Failed to refund payment:", error);
    throw new Error(
      `Failed to refund payment: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    session.endSession();
  }
};

/**
 * Get payment status
 */
const getPaymentStatusService = async (paymentIntentId: string) => {
  const payment = await Payment.findOne({ paymentIntentId })
    .populate("userId", "name email")
    .populate("designId", "title basePrice")
    .populate("courseId", "title basePrice")
    .populate("pricingPlanId", "name price duration")
    .populate("purchaseId");

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
};

export const PaymentServiceInstance = {
  createPaymentIntentService,
  confirmPaymentService,
  refundPaymentService,
  getPaymentStatusService,
};
