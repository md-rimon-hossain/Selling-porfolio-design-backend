import { z } from "zod";

// Download validation schema
export const downloadDesignSchema = z.object({
  params: z.object({
    designId: z
      .string({
        required_error: "Design ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format"),
  }),
});

// Download query parameters validation schema
export const downloadQuerySchema = z.object({
  query: z.object({
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

    sortBy: z.enum(["downloadDate", "createdAt"]).default("downloadDate"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),

    downloadType: z.enum(["individual_purchase", "subscription"]).optional(),
  }),
});

// Download analytics validation schema
export const downloadAnalyticsSchema = z.object({
  query: z.object({
    period: z
      .enum(["daily", "weekly", "monthly", "yearly"], {
        invalid_type_error: "Period must be daily, weekly, monthly, or yearly",
      })
      .default("monthly"),

    startDate: z.string().datetime("Invalid start date format").optional(),

    endDate: z.string().datetime("Invalid end date format").optional(),
  }),
});

export type DownloadDesignInput = z.TypeOf<typeof downloadDesignSchema>;
export type DownloadQueryInput = z.TypeOf<typeof downloadQuerySchema>;
export type DownloadAnalyticsInput = z.TypeOf<typeof downloadAnalyticsSchema>;
