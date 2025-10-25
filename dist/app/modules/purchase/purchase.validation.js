"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseAnalyticsSchema = exports.purchaseParamsSchema = exports.purchaseQuerySchema = exports.cancelPurchaseSchema = exports.updatePurchaseSchema = exports.createPurchaseSchema = void 0;
const zod_1 = require("zod");
// Purchase creation validation schema
exports.createPurchaseSchema = zod_1.z
    .object({
    body: zod_1.z.object({
        purchaseType: zod_1.z.enum(["individual", "subscription"], {
            required_error: "Purchase type is required",
            invalid_type_error: "Purchase type must be 'individual' or 'subscription'",
        }),
        design: zod_1.z
            .string({
            required_error: "Design ID is required for individual purchases",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format")
            .optional(),
        pricingPlan: zod_1.z
            .string({
            required_error: "Pricing plan ID is required for subscription purchases",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid pricing plan ID format")
            .optional(),
        paymentMethod: zod_1.z
            .enum(["credit_card", "paypal", "stripe", "bank_transfer", "free"], {
            required_error: "Payment method is required",
            invalid_type_error: "Payment method must be credit_card, paypal, stripe, bank_transfer, or free",
        })
            .optional(),
        paymentDetails: zod_1.z
            .object({
            cardNumber: zod_1.z.string().optional(),
            expiryDate: zod_1.z.string().optional(),
            cvv: zod_1.z.string().optional(),
            cardholderName: zod_1.z.string().optional(),
            paypalEmail: zod_1.z.string().email().optional(),
            bankAccountNumber: zod_1.z.string().optional(),
        }),
        currency: zod_1.z
            .string()
            .length(3, "Currency must be 3 characters")
            .optional(),
        billingAddress: zod_1.z
            .object({
            street: zod_1.z.string().min(1, "Street is required"),
            city: zod_1.z.string().min(1, "City is required"),
            state: zod_1.z.string().min(1, "State is required"),
            zipCode: zod_1.z.string().min(1, "Zip code is required"),
            country: zod_1.z.string().min(1, "Country is required"),
        })
            .optional(),
        notes: zod_1.z
            .string()
            .max(500, "Notes cannot exceed 500 characters")
            .optional(),
    }),
})
    .refine((data) => {
    // For individual purchases, design is required
    if (data.body.purchaseType === "individual" && !data.body.design) {
        return false;
    }
    // For subscription purchases, pricingPlan is required
    if (data.body.purchaseType === "subscription" && !data.body.pricingPlan) {
        return false;
    }
    return true;
}, {
    message: "Design ID is required for individual purchases, and Pricing Plan ID is required for subscription purchases",
});
// Purchase update validation schema (for admin/payment status updates)
exports.updatePurchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z
            .enum(["pending", "completed", "expired", "cancelled", "refunded"], {
            invalid_type_error: "Status must be pending, completed, expired, cancelled, or refunded",
        })
            .optional(),
        adminNotes: zod_1.z
            .string()
            .max(500, "Admin notes cannot exceed 500 characters")
            .optional(),
    }),
});
// Purchase cancellation validation schema
exports.cancelPurchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        cancelReason: zod_1.z
            .string()
            .max(200, "Cancel reason cannot exceed 200 characters")
            .optional(),
    }),
});
// Purchase query parameters validation schema
exports.purchaseQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        paymentStatus: zod_1.z.enum(["Pending", "Paid", "Cancelled"]).optional(),
        purchaseType: zod_1.z.enum(["individual", "subscription"]).optional(),
        status: zod_1.z
            .enum(["pending", "completed", "expired", "cancelled", "refunded"])
            .optional(),
        customer: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid customer ID format")
            .optional(),
        design: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format")
            .optional(),
        startDate: zod_1.z.string().datetime("Invalid start date format").optional(),
        endDate: zod_1.z.string().datetime("Invalid end date format").optional(),
        page: zod_1.z
            .string()
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val) && val > 0, "Page must be a positive integer")
            .default("1"),
        limit: zod_1.z
            .string()
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val) && val > 0 && val <= 100, "Limit must be between 1 and 100")
            .default("10"),
        sortBy: zod_1.z
            .enum(["purchaseDate", "createdAt", "updatedAt"])
            .default("purchaseDate"),
        sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
    }),
});
// MongoDB ObjectId validation for params
exports.purchaseParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string({
            required_error: "Purchase ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid purchase ID format"),
    }),
});
// Purchase analytics validation schema
exports.purchaseAnalyticsSchema = zod_1.z.object({
    query: zod_1.z.object({
        period: zod_1.z
            .enum(["daily", "weekly", "monthly", "yearly"], {
            invalid_type_error: "Period must be daily, weekly, monthly, or yearly",
        })
            .default("monthly"),
        startDate: zod_1.z.string().datetime("Invalid start date format").optional(),
        endDate: zod_1.z.string().datetime("Invalid end date format").optional(),
        designId: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format")
            .optional(),
    }),
});
