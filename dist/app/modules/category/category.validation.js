"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryParamsSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
// Category creation validation schema
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({
            required_error: "Category name is required",
        })
            .min(2, "Category name must be at least 2 characters long")
            .max(50, "Category name cannot exceed 50 characters")
            .regex(/^[a-zA-Z\s]+$/, "Category name can only contain letters and spaces"),
        description: zod_1.z
            .string({
            required_error: "Category description is required",
        })
            .min(10, "Description must be at least 10 characters long")
            .max(200, "Description cannot exceed 200 characters"),
        isActive: zod_1.z.boolean().default(true),
        isDeleted: zod_1.z.boolean().default(false),
    }),
});
// Category update validation schema
exports.updateCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(2, "Category name must be at least 2 characters long")
            .max(50, "Category name cannot exceed 50 characters")
            .regex(/^[a-zA-Z\s]+$/, "Category name can only contain letters and spaces")
            .optional(),
        description: zod_1.z
            .string()
            .min(10, "Description must be at least 10 characters long")
            .max(200, "Description cannot exceed 200 characters")
            .optional(),
        isActive: zod_1.z.boolean().optional(),
        isDeleted: zod_1.z.boolean().optional(),
    }),
});
// Category params validation schema
exports.categoryParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string({
            required_error: "Category ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format"),
    }),
});
