import { z } from "zod";

// Helpers to coerce form-data string fields into arrays/numbers when validation runs as middleware
const parseToArray = (val: unknown) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return [];
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p)) return p;
    } catch {
      return s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }
  return val;
};

const parseToNumber = (val: unknown) => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isFinite(n) ? n : val;
  }
  return val;
};

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

    // 💡 ADDITION: Design Type (from Mongoose schema)
    designType: z.enum(
      [
        "Logo",
        "Poster",
        "UI/UX Design",
        "Presentation",
        "Print/Packaging",
        "Illustration/Art",
        "Social Media Graphic",
        "Other",
      ],
      {
        required_error: "Design type is required",
        invalid_type_error: "Invalid design type specified",
      },
    ),

    usedTools: z.preprocess(
      parseToArray,
      z
        .array(z.string().min(1, "Tool name cannot be empty"))
        .min(1, "At least one tool must be specified")
        .max(10, "Cannot exceed 10 tools"),
    ), // Reduced limit for realism

    effectsUsed: z
      .preprocess(
        parseToArray,
        z
          .array(z.string().min(1, "Effect name cannot be empty"))
          .max(10, "Cannot exceed 10 effects"),
      )
      .optional(), // Reduced limit for realism

    // 💡 CORRECTION: Renamed 'price' to 'basePrice' to match Mongoose schema
    basePrice: z.preprocess(
      parseToNumber,
      z
        .number({ required_error: "Base Price is required" })
        .min(0, "Price cannot be negative")
        .max(10000, "Price cannot exceed $10,000"),
    ),

    // 💡 ADDITION: discountedPrice (Optional)
    discountedPrice: z.preprocess(
      parseToNumber,
      z
        .number()
        .min(0, "Discounted price cannot be negative")
        .max(10000, "Discounted price cannot exceed $10,000")
        .optional()
        .nullable(),
    ),

    processDescription: z
      .string({
        required_error: "Process description is required",
      })
      .min(20, "Process description must be at least 20 characters long")
      .max(2000, "Process description cannot exceed 2000 characters"),

    complexityLevel: z.enum(["Basic", "Intermediate", "Advanced"], {
      required_error: "Complexity level is required",
    }),

    tags: z.preprocess(
      parseToArray,
      z
        .array(z.string().min(1, "Tag cannot be empty"))
        .min(1, "At least one tag must be specified")
        .max(10, "Cannot exceed 10 tags"),
    ),

    status: z
      .enum(["Active", "Pending", "Rejected", "Inactive"], {
        invalid_type_error: "Status must be 'Draft' or 'Pending' on creation",
      })
      .default("Active")
      .optional(), 

    // 💡 ADDITION: Included Formats (from Mongoose schema)
    includedFormats: z.preprocess(
      parseToArray,
      z
        .array(z.string().min(1, "Format cannot be empty"))
        .min(1, "At least one included format must be specified")
        .max(10, "Cannot exceed 10 included formats"),
    ),
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
    // Support filtering by mainCategory and/or subCategory (accept ObjectId or slug)
    mainCategory: z
      .string()
      .optional()
      .refine(
        (v) => {
          if (v === undefined) return true;
          const objectIdRegex = /^[0-9a-fA-F]{24}$/;
          const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
          return objectIdRegex.test(v) || slugRegex.test(v);
        },
        {
          message: "mainCategory must be an ObjectId or a slug",
        },
      ),

    subCategory: z
      .string()
      .optional()
      .refine(
        (v) => {
          if (v === undefined) return true;
          const objectIdRegex = /^[0-9a-fA-F]{24}$/;
          const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
          return objectIdRegex.test(v) || slugRegex.test(v);
        },
        {
          message: "subCategory must be an ObjectId or a slug",
        },
      ),

    // complexityLevel can be single or multi (CSV / repeated params / JSON array)
    complexityLevel: z.preprocess(
      parseToArray,
      z.array(z.enum(["Basic", "Intermediate", "Advanced"])).optional(),
    ),

    // tags support multi values (CSV, repeated params or JSON array)
    tags: z.preprocess(parseToArray, z.array(z.string()).optional()),

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
