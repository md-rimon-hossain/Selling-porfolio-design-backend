"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingPlan = void 0;
const mongoose_1 = require("mongoose");
// Create the schema
const pricingPlanSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Plan name is required"],
        unique: true,
        trim: true,
        lowercase: true,
    },
    description: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"],
    },
    finalPrice: {
        type: Number,
        min: [0, "Final price cannot be negative"],
    },
    features: [
        {
            type: String,
            required: true,
            trim: true,
        },
    ],
    duration: {
        type: String,
        required: [true, "Duration is required"],
        trim: true,
    },
    maxDesigns: {
        type: Number,
        min: [1, "Max designs must be at least 1"],
    },
    maxDownloads: {
        type: Number,
        min: [1, "Max downloads must be at least 1"],
    },
    priority: {
        type: Number,
        default: 1,
        min: [1, "Priority must be at least 1"],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    discountPercentage: {
        type: Number,
        default: 0,
        min: [0, "Discount percentage cannot be negative"],
        max: [100, "Discount percentage cannot exceed 100"],
    },
    validUntil: {
        type: Date,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Export the model
exports.PricingPlan = (0, mongoose_1.model)("PricingPlan", pricingPlanSchema);
