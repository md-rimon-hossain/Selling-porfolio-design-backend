import { z } from "zod";

// User registration validation schema
export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: "Name is required",
      })
      .min(2, "Name must be at least 2 characters long")
      .max(50, "Name cannot exceed 50 characters"),

    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Please provide a valid email address"),

    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Password must be at least 6 characters long")
      .max(100, "Password cannot exceed 100 characters"),

    role: z
      .enum(["admin", "customer"], {
        required_error: "Role is required",
        invalid_type_error: "Role must be either 'admin' or 'customer'",
      })
      .default("customer"),

    isActive: z.boolean().default(true),
    isDeleted: z.boolean().default(false),

    profileImage: z
      .string()
      .url("Profile image must be a valid URL")
      .optional(),
  }),
});

// User login validation schema
export const loginUserSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Please provide a valid email address"),

    password: z
      .string({
        required_error: "Password is required",
      })
      .min(1, "Password is required"),
  }),
});

// User update validation schema
export const updateUserSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long")
      .max(50, "Name cannot exceed 50 characters")
      .optional(),

    email: z.string().email("Please provide a valid email address").optional(),

    profileImage: z
      .string()
      .url("Profile image must be a valid URL")
      .optional(),

    // Note: Password updates should typically be handled separately for security
  }),
});

// Password change validation schema
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
        .min(6, "New password must be at least 6 characters long")
        .max(100, "New password cannot exceed 100 characters"),

      confirmPassword: z.string({
        required_error: "Password confirmation is required",
      }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "New password and confirmation password do not match",
      path: ["confirmPassword"],
    }),
});

// MongoDB ObjectId validation for params
export const userParamsSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "User ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
  }),
});

export type CreateUserInput = z.TypeOf<typeof createUserSchema>;
export type LoginUserInput = z.TypeOf<typeof loginUserSchema>;
export type UpdateUserInput = z.TypeOf<typeof updateUserSchema>;
export type ChangePasswordInput = z.TypeOf<typeof changePasswordSchema>;
export type UserParamsInput = z.TypeOf<typeof userParamsSchema>;
