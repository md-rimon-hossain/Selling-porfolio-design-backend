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
        required: function () {
            return this.purchaseType === "individual";
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
    currency: {
        type: String,
        required: [true, "Currency is required"],
        default: "BDT",
        uppercase: true,
    },
    paymentMethod: {
        type: String,
        required: [true, "Payment method is required"],
        enum: ["credit_card", "paypal", "stripe", "bank_transfer", "free"],
    },
    paymentDetails: {
        type: mongoose_1.Schema.Types.Mixed,
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
            return this.purchaseType === "subscription" && this.status === "completed";
        },
    },
    subscriptionEndDate: {
        type: Date,
        required: function () {
            return this.purchaseType === "subscription" && this.status === "completed";
        },
    },
    remainingDownloads: {
        type: Number,
        min: [0, "Remaining downloads cannot be negative"],
        required: function () {
            return this.purchaseType === "subscription" && this.status === "completed";
        },
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
// Export the model
exports.Purchase = (0, mongoose_1.model)("Purchase", purchaseSchema);
