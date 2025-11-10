"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewAnalyticsSchema = exports.reviewHelpfulnessSchema = exports.designReviewsParamsSchema = exports.reviewParamsSchema = exports.reviewQuerySchema = exports.updateReviewSchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
// Review creation validation schema
exports.createReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        designId: zod_1.z
            .string({
            required_error: "Design ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format"),
        rating: zod_1.z
            .number({
            required_error: "Rating is required",
        })
            .int("Rating must be an integer")
            .min(1, "Rating must be at least 1")
            .max(5, "Rating cannot be more than 5"),
        comment: zod_1.z
            .string({
            required_error: "Comment is required",
        })
            .min(10, "Comment must be at least 10 characters long")
            .max(1000, "Comment cannot exceed 1000 characters")
            .trim(),
        title: zod_1.z
            .string()
            .min(5, "Review title must be at least 5 characters long")
            .max(100, "Review title cannot exceed 100 characters")
            .trim()
            .optional(),
        pros: zod_1.z
            .array(zod_1.z.string().min(1, "Pro cannot be empty").trim())
            .max(10, "Cannot exceed 10 pros")
            .optional(),
        cons: zod_1.z
            .array(zod_1.z.string().min(1, "Con cannot be empty").trim())
            .max(10, "Cannot exceed 10 cons")
            .optional(),
    }),
});
// Review update validation schema
exports.updateReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        rating: zod_1.z
            .number()
            .int("Rating must be an integer")
            .min(1, "Rating must be at least 1")
            .max(5, "Rating cannot be more than 5")
            .optional(),
        comment: zod_1.z
            .string()
            .min(10, "Comment must be at least 10 characters long")
            .max(1000, "Comment cannot exceed 1000 characters")
            .trim()
            .optional(),
        title: zod_1.z
            .string()
            .min(5, "Review title must be at least 5 characters long")
            .max(100, "Review title cannot exceed 100 characters")
            .trim()
            .optional(),
        pros: zod_1.z
            .array(zod_1.z.string().min(1, "Pro cannot be empty").trim())
            .max(10, "Cannot exceed 10 pros")
            .optional(),
        cons: zod_1.z
            .array(zod_1.z.string().min(1, "Con cannot be empty").trim())
            .max(10, "Cannot exceed 10 cons")
            .optional(),
        isHelpful: zod_1.z.boolean().optional(),
    }),
});
// Review query parameters validation schema
exports.reviewQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        designId: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format")
            .optional(),
        reviewer: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid reviewer ID format")
            .optional(),
        rating: zod_1.z
            .string()
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val) && val >= 1 && val <= 5, "Rating must be between 1 and 5")
            .optional(),
        minRating: zod_1.z
            .string()
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val) && val >= 1 && val <= 5, "Min rating must be between 1 and 5")
            .optional(),
        maxRating: zod_1.z
            .string()
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val) && val >= 1 && val <= 5, "Max rating must be between 1 and 5")
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
        sortBy: zod_1.z
            .enum(["rating", "createdAt", "updatedAt", "helpful"])
            .default("createdAt"),
        sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
        search: zod_1.z
            .string()
            .min(1, "Search term cannot be empty")
            .max(100, "Search term cannot exceed 100 characters")
            .optional(),
    }),
});
// MongoDB ObjectId validation for params
exports.reviewParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string({
            required_error: "Review ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid review ID format"),
    }),
});
// Design reviews params validation
exports.designReviewsParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        designId: zod_1.z
            .string({
            required_error: "Design ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format"),
    }),
});
// Review helpfulness validation schema
exports.reviewHelpfulnessSchema = zod_1.z.object({
    body: zod_1.z.object({
        isHelpful: zod_1.z.boolean({
            required_error: "Helpfulness status is required",
        }),
    }),
});
// Review analytics validation schema
exports.reviewAnalyticsSchema = zod_1.z.object({
    query: zod_1.z.object({
        designId: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format")
            .optional(),
        period: zod_1.z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
        startDate: zod_1.z.string().datetime("Invalid start date format").optional(),
        endDate: zod_1.z.string().datetime("Invalid end date format").optional(),
    }),
});
