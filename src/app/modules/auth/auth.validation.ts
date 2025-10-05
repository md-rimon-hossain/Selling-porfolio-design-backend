import { z } from "zod";

// Auth login validation schema
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Please provide a valid email address")
      .toLowerCase(),

    password: z
      .string({
        required_error: "Password is required",
      })
      .min(1, "Password is required"),
  }),
});

// Auth registration validation schema
export const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string({
          required_error: "Name is required",
        })
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name cannot exceed 50 characters")
        .trim(),

      email: z
        .string({
          required_error: "Email is required",
        })
        .email("Please provide a valid email address")
        .toLowerCase(),

      password: z
        .string({
          required_error: "Password is required",
        })
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password cannot exceed 100 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          "Password must contain at least one lowercase letter, one uppercase letter, and one number",
        ),

      confirmPassword: z.string({
        required_error: "Password confirmation is required",
      }),

      role: z
        .enum(["admin", "customer"], {
          invalid_type_error: "Role must be either 'admin' or 'customer'",
        })
        .default("customer"),

      profileImage: z
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
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Please provide a valid email address")
      .toLowerCase(),
  }),
});

// Reset password validation schema
export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z
        .string({
          required_error: "Reset token is required",
        })
        .min(1, "Reset token is required"),

      newPassword: z
        .string({
          required_error: "New password is required",
        })
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password cannot exceed 100 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          "Password must contain at least one lowercase letter, one uppercase letter, and one number",
        ),

      confirmPassword: z.string({
        required_error: "Password confirmation is required",
      }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "New password and confirmation password do not match",
      path: ["confirmPassword"],
    }),
});

// Change password validation schema (for authenticated users)
export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({
          required_error: "Current password is required",
        })
        .min(1, "Current password is required"),

      newPassword: z
        .string({
          required_error: "New password is required",
        })
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password cannot exceed 100 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          "Password must contain at least one lowercase letter, one uppercase letter, and one number",
        ),

      confirmPassword: z.string({
        required_error: "Password confirmation is required",
      }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "New password and confirmation password do not match",
      path: ["confirmPassword"],
    }),
});

export type LoginInput = z.TypeOf<typeof loginSchema>;
export type RegisterInput = z.TypeOf<typeof registerSchema>;
export type ForgotPasswordInput = z.TypeOf<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.TypeOf<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.TypeOf<typeof changePasswordSchema>;
