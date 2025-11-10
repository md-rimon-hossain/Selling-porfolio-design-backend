"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Purchase = void 0;
const mongoose_1 = require("mongoose");
// Create the schema
const purchaseSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
    },
    purchaseType: {
        type: String,
        required: [true, "Purchase type is required"],
        enum: ["individual", "subscription"],
    },
    design: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Design",
        // Required only when purchaseType is 'individual' AND no course is provided
        required: function () {
            return this.purchaseType === "individual" && !this.course;
        },
    },
    course: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Course",
        // Required only when purchaseType is 'individual' AND no design is provided
        required: function () {
            return this.purchaseType === "individual" && !this.design;
        },
    },
    pricingPlan: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    currencyDisplay: {
        type: String,
        required: [true, "Currency display is required"],
        default: "$", // Default to usd
    },
    currency: {
        type: String,
        required: [true, "Currency is required"],
        default: "usd",
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
        type: mongoose_1.Schema.Types.Mixed,
    },
    // Stripe-specific fields for direct reference and faster queries
    stripePaymentIntentId: {
        type: String,
        index: true,
        sparse: true, // Only index if present (for Stripe payments only)
    },
    stripeCustomerId: {
        type: String,
        index: true,
        sparse: true,
    },
    status: {
        type: String,
        required: [true, "Status is required"],
        enum: [
            "pending",
            "completed",
            "expired",
            "cancelled",
            "refunded",
            "verification_required",
        ],
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
            return (this.purchaseType === "subscription" && this.status === "completed");
        },
    },
    subscriptionEndDate: {
        type: Date,
        required: function () {
            return (this.purchaseType === "subscription" && this.status === "completed");
        },
    },
    remainingDownloads: {
        type: Number,
        min: [0, "Remaining downloads cannot be negative"],
        required: function () {
            return (this.purchaseType === "subscription" && this.status === "completed");
        },
    },
    itemMaxDownloads: {
        type: Number,
        min: 0,
        default: 0,
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
}, {
    timestamps: true,
    versionKey: false,
});
// Indexes for better query performance
purchaseSchema.index({ user: 1, status: 1 }); // User's purchases by status
purchaseSchema.index({ user: 1, purchaseType: 1 }); // User's purchases by type
purchaseSchema.index({ stripePaymentIntentId: 1 }); // Quick lookup by Stripe payment
purchaseSchema.index({ subscriptionEndDate: 1 }, { sparse: true }); // Find expiring subscriptions
purchaseSchema.index({ purchaseDate: -1 }); // Recent purchases first
// 💡 Validation Hook
purchaseSchema.pre("validate", function (next) {
    const isIndividual = this.purchaseType === "individual";
    const hasItem = !!this.design || !!this.course;
    // Check for individual purchase: must have exactly one item (Design or Course)
    if (isIndividual) {
        if (!!this.design === !!this.course) {
            return next(new Error("Individual purchase must reference exactly one Design or one Course."));
        }
    }
    // Check for subscription: must NOT have an item reference
    else if (this.purchaseType === "subscription" && hasItem) {
        return next(new Error("Subscription purchase cannot reference a specific Design or Course."));
    }
    next();
});
// Export the model
exports.Purchase = (0, mongoose_1.model)("Purchase", purchaseSchema);
