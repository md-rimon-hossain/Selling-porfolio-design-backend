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

    // 💡 CORRECTION: Splitting 'category' into 'mainCategory' and 'subCategory'
    mainCategory: z
      .string({
        required_error: "Main category ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Main Category ID format"),

    subCategory: z
      .string({
        required_error: "Sub category ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Sub Category ID format"),

    description: z
      .string({
        required_error: "Description is required",
      })
      .min(10, "Description must be at least 10 characters long")
      .max(1000, "Description cannot exceed 1000 characters"),

    // 💡 ENHANCEMENT: Changed from a single previewImageUrl to an array (as per Mongoose schema)
    // Made optional because server may produce previewImageUrls from uploaded images
    previewImageUrls: z
      .array(z.string().url("Preview image must be a valid URL"))
      .min(1, "At least one preview image URL is required")
      .max(5, "Cannot exceed 5 preview images")
      .optional(), // optional when files are uploaded

    // 💡 ADDITION: Design Type (from Mongoose schema)
    designType: z.enum(["Logo", "Poster", "UI Kit", "Presentation", "Other"], {
      required_error: "Design type is required",
      invalid_type_error: "Invalid design type specified",
    }),

    usedTools: z
      .array(z.string().min(1, "Tool name cannot be empty"))
      .min(1, "At least one tool must be specified")
      .max(10, "Cannot exceed 10 tools"), // Reduced limit for realism

    effectsUsed: z
      .array(z.string().min(1, "Effect name cannot be empty"))
      .min(0) // Allow 0 effects
      .max(10, "Cannot exceed 10 effects"), // Reduced limit for realism

    // 💡 CORRECTION: Renamed 'price' to 'basePrice' to match Mongoose schema
    basePrice: z
      .number({
        required_error: "Base Price is required",
      })
      .min(0, "Price cannot be negative")
      .max(10000, "Price cannot exceed $10,000"),

    // 💡 ADDITION: discountedPrice (Optional)
    discountedPrice: z
      .number()
      .min(0, "Discounted price cannot be negative")
      .max(10000, "Discounted price cannot exceed $10,000")
      .optional()
      .nullable(),

    processDescription: z
      .string({
        required_error: "Process description is required",
      })
      .min(20, "Process description must be at least 20 characters long")
      .max(2000, "Process description cannot exceed 2000 characters"),

    complexityLevel: z.enum(["Basic", "Intermediate", "Advanced"], {
      required_error: "Complexity level is required",
    }),

    tags: z
      .array(z.string().min(1, "Tag cannot be empty"))
      .min(1, "At least one tag must be specified")
      .max(10, "Cannot exceed 10 tags"),

    // 💡 ENHANCEMENT: Only allow 'Draft' or 'Pending' status on initial creation
    status: z
      .enum(["Pending"], {
        // 'Pending' if ready for admin review, 'Draft' if still working on it.
        invalid_type_error: "Status must be 'Draft' or 'Pending' on creation",
      })
      .default("Pending")
      .optional(), // Default is Draft if not provided

    // 💡 ADDITION: Downloadable File details (optional - if uploaded server-side will provide this)
    downloadableFile: z
      .object(
        {
          public_id: z
            .string({ required_error: "Public ID is required" })
            .min(5),
          secure_url: z
            .string({ required_error: "Secure URL is required" })
            .url("Secure URL must be valid"),
          file_format: z
            .string({ required_error: "File format is required" })
            .max(10),
          file_size: z
            .number({ required_error: "File size is required" })
            .min(100, "File size is too small"),
        },
        { required_error: "Downloadable file details are required" },
      )
      .optional(),

    // 💡 ADDITION: Included Formats (from Mongoose schema)
    includedFormats: z
      .array(z.string().min(1, "Format cannot be empty"))
      .min(1, "At least one included format must be specified")
      .max(10, "Cannot exceed 10 included formats"),
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

    // allow updating mainCategory/subCategory individually but validate in controller
    mainCategory: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Main Category ID format")
      .optional(),

    subCategory: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Sub Category ID format")
      .optional(),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters long")
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),

    previewImageUrls: z.array(z.string().url()).optional(),

    designerName: z
      .string()
      .min(2, "Designer name must be at least 2 characters long")
      .max(100, "Designer name cannot exceed 100 characters")
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

    basePrice: z.number().min(0, "Base price cannot be negative").optional(),
    discountedPrice: z
      .number()
      .min(0, "Discounted price cannot be negative")
      .optional(),

    processDescription: z
      .string()
      .min(20, "Process description must be at least 20 characters long")
      .max(5000, "Process description cannot exceed 5000 characters")
      .optional(),

    complexityLevel: z
      .enum(["Basic", "Intermediate", "Advanced"], {
        invalid_type_error:
          "Complexity level must be 'Basic', 'Intermediate', or 'Advanced'",
      })
      .optional(),

    tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),

    status: z
      .enum(
        ["Active", "Draft", "Archived", "Pending", "Rejected", "Inactive"],
        {
          invalid_type_error: "Invalid status",
        },
      )
      .optional(),
    isDeleted: z.boolean().optional(),

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
    // Support filtering by mainCategory and/or subCategory
    mainCategory: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Main Category ID format")
      .optional(),
    subCategory: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Sub Category ID format")
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
