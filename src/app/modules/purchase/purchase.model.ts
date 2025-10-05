import { Schema, model, Types } from "mongoose";

// Define the interface for Purchase
export interface IPurchase {
  _id?: string;
  user: Types.ObjectId;
  pricingPlan: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: "credit_card" | "paypal" | "stripe" | "bank_transfer" | "free";
  paymentDetails?: Record<string, unknown>;
  status: "pending" | "active" | "expired" | "cancelled" | "refunded";
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  purchaseDate?: Date;
  activatedAt?: Date;
  expiredAt?: Date;
  cancelledAt?: Date;
  notes?: string;
  adminNotes?: string;
  cancelReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const purchaseSchema = new Schema<IPurchase>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    pricingPlan: {
      type: Schema.Types.ObjectId,
      ref: "PricingPlan",
      required: [true, "Pricing plan is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "USD",
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["credit_card", "paypal", "stripe", "bank_transfer", "free"],
    },
    paymentDetails: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["pending", "active", "expired", "cancelled", "refunded"],
      default: "pending",
    },
    billingAddress: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    activatedAt: {
      type: Date,
    },
    expiredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Export the model
export const Purchase = model<IPurchase>("Purchase", purchaseSchema);
