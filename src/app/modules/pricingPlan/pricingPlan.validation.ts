import { z } from "zod";

// Pricing plan creation validation schema
export const createPricingPlanSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: "Plan name is required",
      })
      .min(3, "Plan name must be at least 3 characters long")
      .max(50, "Plan name cannot exceed 50 characters")
      .trim(),

    description: z
      .string()
      .min(1, "Description cannot be empty")
      .max(500, "Description cannot exceed 500 characters")
      .trim()
      .optional(),

    price: z
      .number({
        required_error: "Price is required",
      })
      .min(0, "Price cannot be negative")
      .max(99999.99, "Price cannot exceed $99,999.99"),

    features: z
      .array(z.string().min(1, "Feature cannot be empty").trim())
      .min(1, "At least one feature must be specified")
      .max(20, "Cannot exceed 20 features"),

    duration: z
      .string({
        required_error: "Duration is required",
      })
      .min(1, "Duration cannot be empty")
      .max(50, "Duration cannot exceed 50 characters")
      .trim(),

    maxDesigns: z
      .number()
      .min(1, "Max designs must be at least 1")
      .max(99999, "Max designs cannot exceed 99,999")
      .optional(),

    maxDownloads: z
      .number()
      .min(1, "Max downloads must be at least 1")
      .max(999999, "Max downloads cannot exceed 999,999")
      .optional(),

    priority: z
      .number()
      .min(1, "Priority must be at least 1")
      .max(100, "Priority cannot exceed 100")
      .default(1),

    isActive: z.boolean().default(true),

    discountPercentage: z
      .number()
      .min(0, "Discount percentage cannot be negative")
      .max(100, "Discount percentage cannot exceed 100")
      .default(0),

    validUntil: z
      .string()
      .datetime("Invalid valid until date format")
      .optional(),
  }),
});

// Pricing plan update validation schema
export const updatePricingPlanSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Plan name must be at least 3 characters long")
      .max(50, "Plan name cannot exceed 50 characters")
      .trim()
      .optional(),

    description: z
      .string()
      .min(1, "Description cannot be empty")
      .max(500, "Description cannot exceed 500 characters")
      .trim()
      .optional(),

    price: z
      .number()
      .min(0, "Price cannot be negative")
      .max(99999.99, "Price cannot exceed $99,999.99")
      .optional(),

    features: z
      .array(z.string().min(1, "Feature cannot be empty").trim())
      .min(1, "At least one feature must be specified")
      .max(20, "Cannot exceed 20 features")
      .optional(),

    duration: z
      .string()
      .min(1, "Duration cannot be empty")
      .max(50, "Duration cannot exceed 50 characters")
      .trim()
      .optional(),

    maxDesigns: z
      .number()
      .min(1, "Max designs must be at least 1")
      .max(99999, "Max designs cannot exceed 99,999")
      .optional(),

    maxDownloads: z
      .number()
      .min(1, "Max downloads must be at least 1")
      .max(999999, "Max downloads cannot exceed 999,999")
      .optional(),

    priority: z
      .number()
      .min(1, "Priority must be at least 1")
      .max(100, "Priority cannot exceed 100")
      .optional(),

    isActive: z.boolean().optional(),

    discountPercentage: z
      .number()
      .min(0, "Discount percentage cannot be negative")
      .max(100, "Discount percentage cannot exceed 100")
      .optional(),

    validUntil: z
      .string()
      .datetime("Invalid valid until date format")
      .optional(),
  }),
});

// Pricing plan query parameters validation schema
export const pricingPlanQuerySchema = z.object({
  query: z.object({
    isActive: z
      .string()
      .transform((val) => val === "true")
      .optional(),

    minPrice: z
      .string()
      .transform((val) => parseFloat(val))
      .refine(
        (val) => !isNaN(val) && val >= 0,
        "Min price must be a valid positive number",
      )
      .optional(),

    maxPrice: z
      .string()
      .transform((val) => parseFloat(val))
      .refine(
        (val) => !isNaN(val) && val >= 0,
        "Max price must be a valid positive number",
      )
      .optional(),

    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine(
        (val) => !isNaN(val) && val > 0,
        "Page must be a positive integer",
      )
      .default("1"),

    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine(
        (val) => !isNaN(val) && val > 0 && val <= 100,
        "Limit must be between 1 and 100",
      )
      .default("10"),

    search: z
      .string()
      .min(1, "Search term cannot be empty")
      .max(100, "Search term cannot exceed 100 characters")
      .optional(),
  }),
});

// MongoDB ObjectId validation for params
export const pricingPlanParamsSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Pricing plan ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid pricing plan ID format"),
  }),
});

// Pricing plan analytics validation schema
export const pricingPlanAnalyticsSchema = z.object({
  query: z.object({
    period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),

    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
      .optional(),

    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
      .optional(),
  }),
});

export type CreatePricingPlanInput = z.TypeOf<typeof createPricingPlanSchema>;
export type UpdatePricingPlanInput = z.TypeOf<typeof updatePricingPlanSchema>;
export type PricingPlanQueryInput = z.TypeOf<typeof pricingPlanQuerySchema>;
export type PricingPlanParamsInput = z.TypeOf<typeof pricingPlanParamsSchema>;
export type PricingPlanAnalyticsInput = z.TypeOf<
  typeof pricingPlanAnalyticsSchema
>;
