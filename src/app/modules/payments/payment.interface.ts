import { Types } from "mongoose";

export interface IPaymentModule {
  // Create payment for any product type
  createPayment: {
    amount: number;
    currency?: string;
    productType: "design" | "course" | "subscription";
    productId: Types.ObjectId | string; // ID of design, course, or pricing plan
    metadata?: Record<string, string>;
  };

  // Payment record in database
  paymentRecord: {
    userId: Types.ObjectId | string;
    productType: "design" | "course" | "subscription";

    // Product references (one of these will be set based on productType)
    designId?: Types.ObjectId | string;
    courseId?: Types.ObjectId | string;
    pricingPlanId?: Types.ObjectId | string;

    // Purchase reference (created after successful payment)
    purchaseId?: Types.ObjectId | string;

    amount: number;
    currency: string;
    status: "pending" | "succeeded" | "failed" | "refunded" | "canceled";
    paymentIntentId: string;

    // Stripe metadata
    stripeCustomerId?: string;
    paymentMethod?: string;

    // Timestamps
    succeededAt?: Date;
    failedAt?: Date;
    refundedAt?: Date;

    // Error tracking
    errorMessage?: string;

    createdAt?: Date;
    updatedAt?: Date;
  };

  // Confirm payment (webhook)
  confirmPayment: {
    paymentIntentId: string;
  };

  // Refund payment
  refundPayment: {
    paymentIntentId: string;
    amount?: number; // Optional: for partial refunds
    reason?: string;
  };
}
