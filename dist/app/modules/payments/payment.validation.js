"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundPaymentSchema = exports.confirmPaymentSchema = exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
/**
 * Schema for creating a payment
 * Supports designs, courses, and subscriptions
 */
exports.createPaymentSchema = zod_1.z.object({
    productType: zod_1.z.enum(["design", "course", "subscription"], {
        errorMap: () => ({
            message: "Product type must be design, course, or subscription",
        }),
    }),
    productId: zod_1.z.string().min(1, "Product ID is required"),
    currency: zod_1.z
        .string()
        .length(3, "Currency must be 3 characters (e.g., USD, BDT)")
        .optional()
        .default("usd"),
});
/**
 * Schema for confirming a payment (webhook use)
 */
exports.confirmPaymentSchema = zod_1.z.object({
    paymentIntentId: zod_1.z.string().min(1, "Payment intent ID is required"),
});
/**
 * Schema for refunding a payment
 */
exports.refundPaymentSchema = zod_1.z.object({
    paymentIntentId: zod_1.z.string().min(1, "Payment intent ID is required"),
    amount: zod_1.z.number().positive("Amount must be positive").optional(),
    reason: zod_1.z.string().min(1, "Reason is required").optional(),
});
