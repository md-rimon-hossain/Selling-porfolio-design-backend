import { Schema, model } from "mongoose";
import { IPaymentModule } from "./payment.interface";

const paymentSchema = new Schema<IPaymentModule["paymentRecord"]>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productType: {
      type: String,
      required: true,
      enum: ["design", "course", "subscription"],
      index: true,
    },

    // Product references (conditional based on productType)
    designId: {
      type: Schema.Types.ObjectId,
      ref: "Design",
      required: function () {
        return this.productType === "design";
      },
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: function () {
        return this.productType === "course";
      },
    },
    pricingPlanId: {
      type: Schema.Types.ObjectId,
      ref: "PricingPlan",
      required: function () {
        return this.productType === "subscription";
      },
    },

    // Purchase reference (set after successful payment)
    purchaseId: {
      type: Schema.Types.ObjectId,
      ref: "Purchase",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      uppercase: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "succeeded", "failed", "refunded", "canceled"],
      default: "pending",
      index: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Stripe metadata
    stripeCustomerId: { type: String },
    paymentMethod: { type: String },

    // Timestamps for different statuses
    succeededAt: { type: Date },
    failedAt: { type: Date },
    refundedAt: { type: Date },

    // Error tracking
    errorMessage: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Compound indexes for efficient queries
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ paymentIntentId: 1, status: 1 });

export const Payment = model<IPaymentModule["paymentRecord"]>(
  "Payment",
  paymentSchema,
);
