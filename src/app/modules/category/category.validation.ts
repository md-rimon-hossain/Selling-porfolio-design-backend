import { z } from "zod";

// Category creation validation schema
export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: "Category name is required",
      })
      .min(2, "Category name must be at least 2 characters long")
      .max(50, "Category name cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z\s]+$/,
        "Category name can only contain letters and spaces",
      ),

    description: z
      .string({
        required_error: "Category description is required",
      })
      .min(10, "Description must be at least 10 characters long")
      .max(200, "Description cannot exceed 200 characters"),

    // parentCategory may be an ObjectId string or explicitly null (for top-level categories)
    parentCategory: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid parent category ID format")
      .nullable()
      .optional(),

    isActive: z.boolean().default(true),
    isDeleted: z.boolean().default(false),
  }),
});

// Category update validation schema
export const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Category name must be at least 2 characters long")
      .max(50, "Category name cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z\s]+$/,
        "Category name can only contain letters and spaces",
      )
      .optional(),
    // allow null to explicitly unset the parent (promotes to top-level)
    parentCategory: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid parent category ID format")
      .nullable()
      .optional(),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters long")
      .max(200, "Description cannot exceed 200 characters")
      .optional(),

    isActive: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
  }),
});

// Category params validation schema
export const categoryParamsSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Category ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format"),
  }),
});

export type CreateCategoryInput = z.TypeOf<typeof createCategorySchema>;
export type UpdateCategoryInput = z.TypeOf<typeof updateCategorySchema>;
export type CategoryParamsInput = z.TypeOf<typeof categoryParamsSchema>;
