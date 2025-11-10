"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// Auth login validation schema
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            required_error: "Email is required",
        })
            .email("Please provide a valid email address")
            .toLowerCase(),
        password: zod_1.z
            .string({
            required_error: "Password is required",
        })
            .min(1, "Password is required"),
    }),
});
// Auth registration validation schema
exports.registerSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        name: zod_1.z
            .string({
            required_error: "Name is required",
        })
            .min(2, "Name must be at least 2 characters long")
            .max(50, "Name cannot exceed 50 characters")
            .trim(),
        email: zod_1.z
            .string({
            required_error: "Email is required",
        })
            .email("Please provide a valid email address")
            .toLowerCase(),
        password: zod_1.z
            .string({
            required_error: "Password is required",
        })
            .min(6, "Password must be at least 6 characters long")
            .max(100, "Password cannot exceed 100 characters")
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
        confirmPassword: zod_1.z.string({
            required_error: "Password confirmation is required",
        }),
        role: zod_1.z
            .enum(["admin", "customer", "super_admin", "designer", "instructor"], {
            invalid_type_error: "Role must be either 'admin' or 'customer'",
        })
            .default("customer"),
        profileImage: zod_1.z
            .string()
            .url("Profile image must be a valid URL")
            .optional(),
    })
        .refine((data) => data.password === data.confirmPassword, {
        message: "Password and confirmation password do not match",
        path: ["confirmPassword"],
    }),
});
// Forgot password validation schema
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            required_error: "Email is required",
        })
            .email("Please provide a valid email address")
            .toLowerCase(),
    }),
});
// Reset password validation schema
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        token: zod_1.z
            .string({
            required_error: "Reset token is required",
        })
            .min(1, "Reset token is required"),
        newPassword: zod_1.z
            .string({
            required_error: "New password is required",
        })
            .min(6, "Password must be at least 6 characters long")
            .max(100, "Password cannot exceed 100 characters")
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
        confirmPassword: zod_1.z.string({
            required_error: "Password confirmation is required",
        }),
    })
        .refine((data) => data.newPassword === data.confirmPassword, {
        message: "New password and confirmation password do not match",
        path: ["confirmPassword"],
    }),
});
// Change password validation schema (for authenticated users)
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
            .min(6, "Password must be at least 6 characters long")
            .max(100, "Password cannot exceed 100 characters")
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
        confirmPassword: zod_1.z.string({
            required_error: "Password confirmation is required",
        }),
    })
        .refine((data) => data.newPassword === data.confirmPassword, {
        message: "New password and confirmation password do not match",
        path: ["confirmPassword"],
    }),
});
