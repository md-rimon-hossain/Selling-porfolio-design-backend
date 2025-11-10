"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userQuerySchema = exports.userParamsSchema = exports.changePasswordSchema = exports.updateUserSchema = exports.loginUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
// User registration validation schema
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({
            required_error: "Name is required",
        })
            .min(2, "Name must be at least 2 characters long")
            .max(50, "Name cannot exceed 50 characters"),
        email: zod_1.z
            .string({
            required_error: "Email is required",
        })
            .email("Please provide a valid email address"),
        password: zod_1.z
            .string({
            required_error: "Password is required",
        })
            .min(6, "Password must be at least 6 characters long")
            .max(100, "Password cannot exceed 100 characters"),
        role: zod_1.z
            .enum(["super_admin", "admin", "customer", "designer", "instructor"], {
            required_error: "Role is required",
            invalid_type_error: "Role must be either 'admin' or 'customer'",
        })
            .default("customer"),
        isActive: zod_1.z.boolean().default(true),
        isDeleted: zod_1.z.boolean().default(false),
        profileImage: zod_1.z
            .string()
            .url("Profile image must be a valid URL")
            .optional(),
    }),
});
// User login validation schema
exports.loginUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            required_error: "Email is required",
        })
            .email("Please provide a valid email address"),
        password: zod_1.z
            .string({
            required_error: "Password is required",
        })
            .min(1, "Password is required"),
    }),
});
// User update validation schema
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(2, "Name must be at least 2 characters long")
            .max(50, "Name cannot exceed 50 characters")
            .optional(),
        email: zod_1.z.string().email("Please provide a valid email address").optional(),
        profileImage: zod_1.z
            .string()
            .url("Profile image must be a valid URL")
            .optional(),
        // Note: Password updates should typically be handled separately for security
    }),
});
// Password change validation schema
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        currentPassword: zod_1.z
            .string({
            required_error: "Current password is required",
        })
            .min(1, "Current password is required"),
        newPassword: zod_1.z
            .string({
            required_error: "New password is required",
        })
            .min(6, "New password must be at least 6 characters long")
            .max(100, "New password cannot exceed 100 characters"),
        confirmPassword: zod_1.z.string({
            required_error: "Password confirmation is required",
        }),
    })
        .refine((data) => data.newPassword === data.confirmPassword, {
        message: "New password and confirmation password do not match",
        path: ["confirmPassword"],
    }),
});
// MongoDB ObjectId validation for params
exports.userParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string({
            required_error: "User ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
    }),
});
// User query parameters validation schema
exports.userQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        role: zod_1.z.enum(["admin", "customer"]).optional(),
        isActive: zod_1.z
            .string()
            .transform((val) => val === "true")
            .optional(),
        search: zod_1.z
            .string()
            .min(1, "Search term cannot be empty")
            .max(100, "Search term cannot exceed 100 characters")
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
        sortBy: zod_1.z
            .enum(["name", "email", "createdAt", "updatedAt"])
            .default("createdAt"),
        sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
    }),
});
