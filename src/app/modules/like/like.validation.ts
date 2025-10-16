import { z } from "zod";

// Like params validation schema
export const likeParamsSchema = z.object({
  params: z.object({
    designId: z
      .string({
        required_error: "Design ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format"),
  }),
});

// Like query validation schema
export const likeQuerySchema = z.object({
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
  }),
});

export type LikeParamsInput = z.TypeOf<typeof likeParamsSchema>;
export type LikeQueryInput = z.TypeOf<typeof likeQuerySchema>;
