"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadAnalyticsSchema = exports.adminDownloadQuerySchema = exports.downloadQuerySchema = exports.downloadDesignSchema = void 0;
const zod_1 = require("zod");
// Download validation schema
exports.downloadDesignSchema = zod_1.z.object({
    params: zod_1.z.object({
        designId: zod_1.z
            .string({
            required_error: "Design ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format"),
    }),
});
// Download query parameters validation schema
exports.downloadQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
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
        sortBy: zod_1.z.enum(["downloadDate", "createdAt"]).default("downloadDate"),
        sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
        downloadType: zod_1.z.enum(["individual_purchase", "subscription"]).optional(),
    }),
});
// Admin download query parameters with advanced filters
exports.adminDownloadQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : 1))
            .refine((val) => !isNaN(val) && val > 0, "Page must be a positive integer")
            .default("1"),
        limit: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : 10))
            .refine((val) => !isNaN(val) && val > 0 && val <= 100, "Limit must be between 1 and 100")
            .default("10"),
        sortBy: zod_1.z
            .enum(["downloadDate", "createdAt"])
            .optional()
            .default("downloadDate"),
        sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
        downloadType: zod_1.z.enum(["individual_purchase", "subscription"]).optional(),
        userId: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
            .optional(),
        designId: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format")
            .optional(),
        search: zod_1.z
            .string()
            .min(1, "Search term must be at least 1 character")
            .max(100, "Search term must not exceed 100 characters")
            .optional(),
        startDate: zod_1.z
            .string()
            .datetime("Invalid start date format (ISO 8601 required)")
            .optional(),
        endDate: zod_1.z
            .string()
            .datetime("Invalid end date format (ISO 8601 required)")
            .optional(),
    }),
});
// Download analytics validation schema
exports.downloadAnalyticsSchema = zod_1.z.object({
    query: zod_1.z.object({
        period: zod_1.z
            .enum(["daily", "weekly", "monthly", "yearly"], {
            invalid_type_error: "Period must be daily, weekly, monthly, or yearly",
        })
            .default("monthly"),
        startDate: zod_1.z.string().datetime("Invalid start date format").optional(),
        endDate: zod_1.z.string().datetime("Invalid end date format").optional(),
    }),
});
