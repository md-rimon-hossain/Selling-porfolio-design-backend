"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingPlanAnalyticsSchema = exports.pricingPlanParamsSchema = exports.pricingPlanQuerySchema = exports.updatePricingPlanSchema = exports.createPricingPlanSchema = void 0;
const zod_1 = require("zod");
// Pricing plan creation validation schema
exports.createPricingPlanSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({
            required_error: "Plan name is required",
        })
            .min(3, "Plan name must be at least 3 characters long")
            .max(50, "Plan name cannot exceed 50 characters")
            .trim(),
        description: zod_1.z
            .string()
            .min(1, "Description cannot be empty")
            .max(500, "Description cannot exceed 500 characters")
            .trim()
            .optional(),
        price: zod_1.z
            .number({
            required_error: "Price is required",
        })
            .min(0, "Price cannot be negative")
            .max(99999.99, "Price cannot exceed $99,999.99"),
        features: zod_1.z
            .array(zod_1.z.string().min(1, "Feature cannot be empty").trim())
            .min(1, "At least one feature must be specified")
            .max(20, "Cannot exceed 20 features"),
        duration: zod_1.z
            .string({
            required_error: "Duration is required",
        })
            .min(1, "Duration cannot be empty")
            .max(50, "Duration cannot exceed 50 characters")
            .trim(),
        maxDesigns: zod_1.z
            .number()
            .min(1, "Max designs must be at least 1")
            .max(99999, "Max designs cannot exceed 99,999")
            .optional(),
        maxDownloads: zod_1.z
            .number()
            .min(1, "Max downloads must be at least 1")
            .max(999999, "Max downloads cannot exceed 999,999")
            .optional(),
        priority: zod_1.z
            .number()
            .min(1, "Priority must be at least 1")
            .max(100, "Priority cannot exceed 100")
            .default(1),
        isActive: zod_1.z.boolean().default(true),
        discountPercentage: zod_1.z
            .number()
            .min(0, "Discount percentage cannot be negative")
            .max(100, "Discount percentage cannot exceed 100")
            .default(0),
        validUntil: zod_1.z
            .string()
            .datetime("Invalid valid until date format")
            .optional(),
    }),
});
// Pricing plan update validation schema
exports.updatePricingPlanSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(3, "Plan name must be at least 3 characters long")
            .max(50, "Plan name cannot exceed 50 characters")
            .trim()
            .optional(),
        description: zod_1.z
            .string()
            .min(1, "Description cannot be empty")
            .max(500, "Description cannot exceed 500 characters")
            .trim()
            .optional(),
        price: zod_1.z
            .number()
            .min(0, "Price cannot be negative")
            .max(99999.99, "Price cannot exceed $99,999.99")
            .optional(),
        features: zod_1.z
            .array(zod_1.z.string().min(1, "Feature cannot be empty").trim())
            .min(1, "At least one feature must be specified")
            .max(20, "Cannot exceed 20 features")
            .optional(),
        duration: zod_1.z
            .string()
            .min(1, "Duration cannot be empty")
            .max(50, "Duration cannot exceed 50 characters")
            .trim()
            .optional(),
        maxDesigns: zod_1.z
            .number()
            .min(1, "Max designs must be at least 1")
            .max(99999, "Max designs cannot exceed 99,999")
            .optional(),
        maxDownloads: zod_1.z
            .number()
            .min(1, "Max downloads must be at least 1")
            .max(999999, "Max downloads cannot exceed 999,999")
            .optional(),
        priority: zod_1.z
            .number()
            .min(1, "Priority must be at least 1")
            .max(100, "Priority cannot exceed 100")
            .optional(),
        isActive: zod_1.z.boolean().optional(),
        discountPercentage: zod_1.z
            .number()
            .min(0, "Discount percentage cannot be negative")
            .max(100, "Discount percentage cannot exceed 100")
            .optional(),
        validUntil: zod_1.z
            .string()
            .datetime("Invalid valid until date format")
            .optional(),
    }),
});
// Pricing plan query parameters validation schema
exports.pricingPlanQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        isActive: zod_1.z
            .string()
            .transform((val) => val === "true")
            .optional(),
        minPrice: zod_1.z
            .string()
            .transform((val) => parseFloat(val))
            .refine((val) => !isNaN(val) && val >= 0, "Min price must be a valid positive number")
            .optional(),
        maxPrice: zod_1.z
            .string()
            .transform((val) => parseFloat(val))
            .refine((val) => !isNaN(val) && val >= 0, "Max price must be a valid positive number")
            .optional(),
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
        search: zod_1.z
            .string()
            .min(1, "Search term cannot be empty")
            .max(100, "Search term cannot exceed 100 characters")
            .optional(),
    }),
});
// MongoDB ObjectId validation for params
exports.pricingPlanParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string({
            required_error: "Pricing plan ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid pricing plan ID format"),
    }),
});
// Pricing plan analytics validation schema
exports.pricingPlanAnalyticsSchema = zod_1.z.object({
    query: zod_1.z.object({
        period: zod_1.z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
        startDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
            .optional(),
        endDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
            .optional(),
    }),
});
