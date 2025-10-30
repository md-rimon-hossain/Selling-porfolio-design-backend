import { Schema, model, Types } from "mongoose";

// Define the interface for Purchase
export interface IPurchase {
  _id?: string;
  user: Types.ObjectId;
  purchaseType: "individual" | "subscription";
  // For individual purchases
  design?: Types.ObjectId; // 💡 Made optional
  course?: Types.ObjectId; // 💡 NEW FIELD

  // For subscription purchases
  pricingPlan?: Types.ObjectId;

  amount: number;
  currency: string;
  paymentMethod:
    | "credit_card"
    | "paypal"
    | "stripe"
    | "bank_transfer"
    | "free"
    | "bkash"
    | "nagad"
    | "rocket";

  userProvidedTransactionId?: string;
  paymentDetails?: Record<string, unknown>;

  status:
    | "pending"
    | "completed"
    | "expired"
    | "cancelled"
    | "refunded"
    | "verification_required"; // 💡 EXPANDED ENUM
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

  // Subscription specific fields
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  remainingDownloads?: number;
  itemMaxDownloads?: number;
  itemDownloadsUsed?: number;
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
    purchaseType: {
      type: String,
      required: [true, "Purchase type is required"],
      enum: ["individual", "subscription"],
    },
    design: {
      type: Schema.Types.ObjectId,
      ref: "Design",
      // Required only when purchaseType is 'individual' AND no course is provided
      required: function () {
        return this.purchaseType === "individual" && !this.course;
      },
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      // Required only when purchaseType is 'individual' AND no design is provided
      required: function () {
        return this.purchaseType === "individual" && !this.design;
      },
    },
    pricingPlan: {
      type: Schema.Types.ObjectId,
      ref: "PricingPlan",
      required: function () {
        return this.purchaseType === "subscription";
      },
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "BDT",
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      // 💡 EXPANDED ENUM to include local mobile financial services (MFS)
      enum: [
        "credit_card",
        "paypal",
        "stripe",
        "bank_transfer",
        "free",
        "bkash",
        "nagad",
        "rocket",
      ],
    },
    // 💡 NEW FIELD: Transaction ID provided by the user
    userProvidedTransactionId: {
      type: String,
      trim: true,
      index: true, // Useful for quickly looking up and verifying payments
      // Make it required only if the payment method is MFS
      required: function () {
        return ["bkash", "nagad", "rocket"].includes(this.paymentMethod);
      },
    },
    paymentDetails: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["pending", "completed", "expired", "cancelled", "refunded"],
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
    subscriptionStartDate: {
      type: Date,
      required: function () {
        return (
          this.purchaseType === "subscription" && this.status === "completed"
        );
      },
    },
    subscriptionEndDate: {
      type: Date,
      required: function () {
        return (
          this.purchaseType === "subscription" && this.status === "completed"
        );
      },
    },
    remainingDownloads: {
      type: Number,
      min: [0, "Remaining downloads cannot be negative"],
      required: function () {
        return (
          this.purchaseType === "subscription" && this.status === "completed"
        );
      },
    },
    itemDownloadsUsed: {
      type: Number,
      default: 0,
      min: 0,
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

// 💡 Validation Hook
purchaseSchema.pre("validate", function (next) {
  const isIndividual = this.purchaseType === "individual";
  const hasItem = !!this.design || !!this.course;

  // Check for individual purchase: must have exactly one item (Design or Course)
  if (isIndividual) {
    if (!!this.design === !!this.course) {
      return next(
        new Error(
          "Individual purchase must reference exactly one Design or one Course.",
        ),
      );
    }
  }
  // Check for subscription: must NOT have an item reference
  else if (this.purchaseType === "subscription" && hasItem) {
    return next(
      new Error(
        "Subscription purchase cannot reference a specific Design or Course.",
      ),
    );
  }
  next();
});

// Export the model
export const Purchase = model<IPurchase>("Purchase", purchaseSchema);
