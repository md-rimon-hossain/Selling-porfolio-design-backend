"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.designParamsSchema = exports.designQuerySchema = exports.updateDesignSchema = exports.createDesignSchema = void 0;
const zod_1 = require("zod");
// Design creation validation schema
exports.createDesignSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z
            .string({
            required_error: "Title is required",
        })
            .min(3, "Title must be at least 3 characters long")
            .max(100, "Title cannot exceed 100 characters"),
        category: zod_1.z
            .string({
            required_error: "Category is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format"),
        description: zod_1.z
            .string({
            required_error: "Description is required",
        })
            .min(10, "Description must be at least 10 characters long")
            .max(1000, "Description cannot exceed 1000 characters"),
        previewImageUrl: zod_1.z
            .string({
            required_error: "Preview image URL is required",
        })
            .url("Preview image must be a valid URL"),
        designerName: zod_1.z
            .string({
            required_error: "Designer name is required",
        })
            .min(2, "Designer name must be at least 2 characters long")
            .max(50, "Designer name cannot exceed 50 characters"),
        usedTools: zod_1.z
            .array(zod_1.z.string().min(1, "Tool name cannot be empty"))
            .min(1, "At least one tool must be specified")
            .max(20, "Cannot exceed 20 tools"),
        effectsUsed: zod_1.z
            .array(zod_1.z.string().min(1, "Effect name cannot be empty"))
            .min(1, "At least one effect must be specified")
            .max(20, "Cannot exceed 20 effects"),
        price: zod_1.z
            .number({
            required_error: "Price is required",
        })
            .min(0, "Price cannot be negative")
            .max(10000, "Price cannot exceed $10,000"),
        processDescription: zod_1.z
            .string({
            required_error: "Process description is required",
        })
            .min(20, "Process description must be at least 20 characters long")
            .max(2000, "Process description cannot exceed 2000 characters"),
        complexityLevel: zod_1.z.enum(["Basic", "Intermediate", "Advanced"], {
            required_error: "Complexity level is required",
            invalid_type_error: "Complexity level must be 'Basic', 'Intermediate', or 'Advanced'",
        }),
        tags: zod_1.z
            .array(zod_1.z.string().min(1, "Tag cannot be empty"))
            .min(1, "At least one tag must be specified")
            .max(10, "Cannot exceed 10 tags"),
        status: zod_1.z
            .enum(["Active", "Draft", "Archived"], {
            invalid_type_error: "Status must be 'Active', 'Draft', or 'Archived'",
        })
            .default("Active"),
        isDeleted: zod_1.z.boolean().default(false),
        likesCount: zod_1.z
            .number()
            .int("Likes count must be an integer")
            .min(0, "Likes count cannot be negative")
            .default(0),
        downloadCount: zod_1.z
            .number()
            .int("Download count must be an integer")
            .min(0, "Download count cannot be negative")
            .default(0),
    }),
});
// Design update validation schema
exports.updateDesignSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z
            .string()
            .min(3, "Title must be at least 3 characters long")
            .max(100, "Title cannot exceed 100 characters")
            .optional(),
        category: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format")
            .optional(),
        description: zod_1.z
            .string()
            .min(10, "Description must be at least 10 characters long")
            .max(1000, "Description cannot exceed 1000 characters")
            .optional(),
        previewImageUrl: zod_1.z
            .string()
            .url("Preview image must be a valid URL")
            .optional(),
        designerName: zod_1.z
            .string()
            .min(2, "Designer name must be at least 2 characters long")
            .max(50, "Designer name cannot exceed 50 characters")
            .optional(),
        usedTools: zod_1.z
            .array(zod_1.z.string().min(1, "Tool name cannot be empty"))
            .min(1, "At least one tool must be specified")
            .max(20, "Cannot exceed 20 tools")
            .optional(),
        effectsUsed: zod_1.z
            .array(zod_1.z.string().min(1, "Effect name cannot be empty"))
            .min(1, "At least one effect must be specified")
            .max(20, "Cannot exceed 20 effects")
            .optional(),
        price: zod_1.z
            .number()
            .min(0, "Price cannot be negative")
            .max(10000, "Price cannot exceed $10,000")
            .optional(),
        processDescription: zod_1.z
            .string()
            .min(20, "Process description must be at least 20 characters long")
            .max(2000, "Process description cannot exceed 2000 characters")
            .optional(),
        complexityLevel: zod_1.z
            .enum(["Basic", "Intermediate", "Advanced"], {
            invalid_type_error: "Complexity level must be 'Basic', 'Intermediate', or 'Advanced'",
        })
            .optional(),
        tags: zod_1.z
            .array(zod_1.z.string().min(1, "Tag cannot be empty"))
            .min(1, "At least one tag must be specified")
            .max(10, "Cannot exceed 10 tags")
            .optional(),
        status: zod_1.z
            .enum(["Active", "Draft", "Archived"], {
            invalid_type_error: "Status must be 'Active', 'Draft', or 'Archived'",
        })
            .optional(),
        isDeleted: zod_1.z.boolean().optional(),
        likesCount: zod_1.z
            .number()
            .int("Likes count must be an integer")
            .min(0, "Likes count cannot be negative")
            .optional(),
        downloadCount: zod_1.z
            .number()
            .int("Download count must be an integer")
            .min(0, "Download count cannot be negative")
            .optional(),
    }),
});
// Design query parameters validation schema
exports.designQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        category: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format")
            .optional(),
        complexityLevel: zod_1.z.enum(["Basic", "Intermediate", "Advanced"]).optional(),
        status: zod_1.z.enum(["Active", "Draft", "Archived"]).optional(),
        minPrice: zod_1.z
            .string()
            .transform((val) => parseFloat(val))
            .refine((val) => !isNaN(val) && val >= 0, "Min price must be a valid positive number")
            .optional(),
        maxPrice: zod_1.z
            .string()
            .transform((val) => parseFloat(val))
            .refine((val) => !isNaN(val) && val >= 0, "Max price must be a valid positive number")
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
        search: zod_1.z
            .string()
            .min(1, "Search term cannot be empty")
            .max(100, "Search term cannot exceed 100 characters")
            .optional(),
    }),
});
// MongoDB ObjectId validation for params
exports.designParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string({
            required_error: "Design ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format"),
    }),
});
