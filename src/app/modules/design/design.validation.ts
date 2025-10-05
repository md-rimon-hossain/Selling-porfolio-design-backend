import { z } from "zod";

// Design creation validation schema
export const createDesignSchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: "Title is required",
      })
      .min(3, "Title must be at least 3 characters long")
      .max(100, "Title cannot exceed 100 characters"),

    category: z
      .string({
        required_error: "Category is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format"),

    description: z
      .string({
        required_error: "Description is required",
      })
      .min(10, "Description must be at least 10 characters long")
      .max(1000, "Description cannot exceed 1000 characters"),

    previewImageUrl: z
      .string({
        required_error: "Preview image URL is required",
      })
      .url("Preview image must be a valid URL"),

    designerName: z
      .string({
        required_error: "Designer name is required",
      })
      .min(2, "Designer name must be at least 2 characters long")
      .max(50, "Designer name cannot exceed 50 characters"),

    usedTools: z
      .array(z.string().min(1, "Tool name cannot be empty"))
      .min(1, "At least one tool must be specified")
      .max(20, "Cannot exceed 20 tools"),

    effectsUsed: z
      .array(z.string().min(1, "Effect name cannot be empty"))
      .min(1, "At least one effect must be specified")
      .max(20, "Cannot exceed 20 effects"),

    price: z
      .number({
        required_error: "Price is required",
      })
      .min(0, "Price cannot be negative")
      .max(10000, "Price cannot exceed $10,000"),

    processDescription: z
      .string({
        required_error: "Process description is required",
      })
      .min(20, "Process description must be at least 20 characters long")
      .max(2000, "Process description cannot exceed 2000 characters"),

    complexityLevel: z.enum(["Basic", "Intermediate", "Advanced"], {
      required_error: "Complexity level is required",
      invalid_type_error:
        "Complexity level must be 'Basic', 'Intermediate', or 'Advanced'",
    }),

    tags: z
      .array(z.string().min(1, "Tag cannot be empty"))
      .min(1, "At least one tag must be specified")
      .max(10, "Cannot exceed 10 tags"),

    status: z
      .enum(["Active", "Draft", "Archived"], {
        invalid_type_error: "Status must be 'Active', 'Draft', or 'Archived'",
      })
      .default("Draft"),

    likesCount: z
      .number()
      .int("Likes count must be an integer")
      .min(0, "Likes count cannot be negative")
      .default(0),

    downloadCount: z
      .number()
      .int("Download count must be an integer")
      .min(0, "Download count cannot be negative")
      .default(0),
  }),
});

// Design update validation schema
export const updateDesignSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters long")
      .max(100, "Title cannot exceed 100 characters")
      .optional(),

    category: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format")
      .optional(),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters long")
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),

    previewImageUrl: z
      .string()
      .url("Preview image must be a valid URL")
      .optional(),

    designerName: z
      .string()
      .min(2, "Designer name must be at least 2 characters long")
      .max(50, "Designer name cannot exceed 50 characters")
      .optional(),

    usedTools: z
      .array(z.string().min(1, "Tool name cannot be empty"))
      .min(1, "At least one tool must be specified")
      .max(20, "Cannot exceed 20 tools")
      .optional(),

    effectsUsed: z
      .array(z.string().min(1, "Effect name cannot be empty"))
      .min(1, "At least one effect must be specified")
      .max(20, "Cannot exceed 20 effects")
      .optional(),

    price: z
      .number()
      .min(0, "Price cannot be negative")
      .max(10000, "Price cannot exceed $10,000")
      .optional(),

    processDescription: z
      .string()
      .min(20, "Process description must be at least 20 characters long")
      .max(2000, "Process description cannot exceed 2000 characters")
      .optional(),

    complexityLevel: z
      .enum(["Basic", "Intermediate", "Advanced"], {
        invalid_type_error:
          "Complexity level must be 'Basic', 'Intermediate', or 'Advanced'",
      })
      .optional(),

    tags: z
      .array(z.string().min(1, "Tag cannot be empty"))
      .min(1, "At least one tag must be specified")
      .max(10, "Cannot exceed 10 tags")
      .optional(),

    status: z
      .enum(["Active", "Draft", "Archived"], {
        invalid_type_error: "Status must be 'Active', 'Draft', or 'Archived'",
      })
      .optional(),

    likesCount: z
      .number()
      .int("Likes count must be an integer")
      .min(0, "Likes count cannot be negative")
      .optional(),

    downloadCount: z
      .number()
      .int("Download count must be an integer")
      .min(0, "Download count cannot be negative")
      .optional(),
  }),
});

// Design query parameters validation schema
export const designQuerySchema = z.object({
  query: z.object({
    category: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format")
      .optional(),

    complexityLevel: z.enum(["Basic", "Intermediate", "Advanced"]).optional(),

    status: z.enum(["Active", "Draft", "Archived"]).optional(),

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
export const designParamsSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Design ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format"),
  }),
});

export type CreateDesignInput = z.TypeOf<typeof createDesignSchema>;
export type UpdateDesignInput = z.TypeOf<typeof updateDesignSchema>;
export type DesignQueryInput = z.TypeOf<typeof designQuerySchema>;
export type DesignParamsInput = z.TypeOf<typeof designParamsSchema>;
