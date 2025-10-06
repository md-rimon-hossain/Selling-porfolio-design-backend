import { z } from "zod";

// Review creation validation schema
export const createReviewSchema = z.object({
  body: z.object({
    designId: z
      .string({
        required_error: "Design ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format"),

    rating: z
      .number({
        required_error: "Rating is required",
      })
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot be more than 5"),

    comment: z
      .string({
        required_error: "Comment is required",
      })
      .min(10, "Comment must be at least 10 characters long")
      .max(1000, "Comment cannot exceed 1000 characters")
      .trim(),

    title: z
      .string()
      .min(5, "Review title must be at least 5 characters long")
      .max(100, "Review title cannot exceed 100 characters")
      .trim()
      .optional(),

    pros: z
      .array(z.string().min(1, "Pro cannot be empty").trim())
      .max(10, "Cannot exceed 10 pros")
      .optional(),

    cons: z
      .array(z.string().min(1, "Con cannot be empty").trim())
      .max(10, "Cannot exceed 10 cons")
      .optional(),
  }),
});

// Review update validation schema
export const updateReviewSchema = z.object({
  body: z.object({
    rating: z
      .number()
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot be more than 5")
      .optional(),

    comment: z
      .string()
      .min(10, "Comment must be at least 10 characters long")
      .max(1000, "Comment cannot exceed 1000 characters")
      .trim()
      .optional(),

    title: z
      .string()
      .min(5, "Review title must be at least 5 characters long")
      .max(100, "Review title cannot exceed 100 characters")
      .trim()
      .optional(),

    pros: z
      .array(z.string().min(1, "Pro cannot be empty").trim())
      .max(10, "Cannot exceed 10 pros")
      .optional(),

    cons: z
      .array(z.string().min(1, "Con cannot be empty").trim())
      .max(10, "Cannot exceed 10 cons")
      .optional(),

    isHelpful: z.boolean().optional(),
  }),
});

// Review query parameters validation schema
export const reviewQuerySchema = z.object({
  query: z.object({
    designId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format")
      .optional(),

    reviewer: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid reviewer ID format")
      .optional(),

    rating: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine(
        (val) => !isNaN(val) && val >= 1 && val <= 5,
        "Rating must be between 1 and 5",
      )
      .optional(),

    minRating: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine(
        (val) => !isNaN(val) && val >= 1 && val <= 5,
        "Min rating must be between 1 and 5",
      )
      .optional(),

    maxRating: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine(
        (val) => !isNaN(val) && val >= 1 && val <= 5,
        "Max rating must be between 1 and 5",
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

    sortBy: z
      .enum(["rating", "createdAt", "updatedAt", "helpful"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),

    search: z
      .string()
      .min(1, "Search term cannot be empty")
      .max(100, "Search term cannot exceed 100 characters")
      .optional(),
  }),
});

// MongoDB ObjectId validation for params
export const reviewParamsSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Review ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid review ID format"),
  }),
});

// Design reviews params validation
export const designReviewsParamsSchema = z.object({
  params: z.object({
    designId: z
      .string({
        required_error: "Design ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format"),
  }),
});

// Review helpfulness validation schema
export const reviewHelpfulnessSchema = z.object({
  body: z.object({
    isHelpful: z.boolean({
      required_error: "Helpfulness status is required",
    }),
  }),
});

// Review analytics validation schema
export const reviewAnalyticsSchema = z.object({
  query: z.object({
    designId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format")
      .optional(),

    period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),

    startDate: z.string().datetime("Invalid start date format").optional(),

    endDate: z.string().datetime("Invalid end date format").optional(),
  }),
});

export type CreateReviewInput = z.TypeOf<typeof createReviewSchema>;
export type UpdateReviewInput = z.TypeOf<typeof updateReviewSchema>;
export type ReviewQueryInput = z.TypeOf<typeof reviewQuerySchema>;
export type ReviewParamsInput = z.TypeOf<typeof reviewParamsSchema>;
export type DesignReviewsParamsInput = z.TypeOf<
  typeof designReviewsParamsSchema
>;
export type ReviewHelpfulnessInput = z.TypeOf<typeof reviewHelpfulnessSchema>;
export type ReviewAnalyticsInput = z.TypeOf<typeof reviewAnalyticsSchema>;
