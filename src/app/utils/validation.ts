import { z } from "zod";

// Common validation patterns
export const commonValidation = {
  // MongoDB ObjectId validation
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),

  // Email validation
  email: z.string().email("Please provide a valid email address").toLowerCase(),

  // Password validation with requirements
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password cannot exceed 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number",
    ),

  // URL validation
  url: z.string().url("Please provide a valid URL"),

  // Phone number validation (basic)
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, "Please provide a valid phone number"),

  // Positive number validation
  positiveNumber: z.number().min(0, "Value must be a positive number"),

  // Price validation
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .max(999999.99, "Price cannot exceed $999,999.99"),

  // Required string with length constraints
  requiredString: (minLength: number = 1, maxLength: number = 255) =>
    z
      .string()
      .min(minLength, `Must be at least ${minLength} characters long`)
      .max(maxLength, `Cannot exceed ${maxLength} characters`)
      .trim(),

  // Optional string with length constraints
  optionalString: (minLength: number = 1, maxLength: number = 255) =>
    z
      .string()
      .min(minLength, `Must be at least ${minLength} characters long`)
      .max(maxLength, `Cannot exceed ${maxLength} characters`)
      .trim()
      .optional(),

  // Array validation with size constraints
  arrayWithMinMax: <T>(
    itemSchema: z.ZodSchema<T>,
    min: number = 1,
    max: number = 100,
  ) =>
    z
      .array(itemSchema)
      .min(min, `Must have at least ${min} item(s)`)
      .max(max, `Cannot exceed ${max} items`),

  // Date validation
  futureDate: z
    .string()
    .datetime("Please provide a valid date")
    .refine((date) => new Date(date) > new Date(), {
      message: "Date must be in the future",
    }),

  pastDate: z
    .string()
    .datetime("Please provide a valid date")
    .refine((date) => new Date(date) < new Date(), {
      message: "Date must be in the past",
    }),

  // Enum validation helper
  createEnum: <T extends string>(values: T[], fieldName: string) =>
    z.enum(values as [T, ...T[]], {
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be one of: ${values.join(", ")}`,
    }),
};

// Password confirmation validation helper
export const createPasswordConfirmationSchema = (
  passwordField: string = "password",
) =>
  z
    .object({
      [passwordField]: commonValidation.password,
      confirmPassword: z.string({
        required_error: "Password confirmation is required",
      }),
    })
    .refine(
      (data: Record<string, string>) =>
        data[passwordField] === data.confirmPassword,
      {
        message: "Password and confirmation password do not match",
        path: ["confirmPassword"],
      },
    );

// Pagination validation schema
export const paginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, "Page must be a positive integer")
    .default("1"),

  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => !isNaN(val) && val > 0 && val <= 100,
      "Limit must be between 1 and 100",
    )
    .default("10"),

  sortBy: z
    .string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid sort field")
    .optional(),

  sortOrder: z
    .enum(["asc", "desc"], {
      invalid_type_error: "Sort order must be 'asc' or 'desc'",
    })
    .default("desc"),
});

// Search validation schema
export const searchSchema = z.object({
  q: z
    .string()
    .min(1, "Search query cannot be empty")
    .max(100, "Search query cannot exceed 100 characters")
    .optional(),

  ...paginationSchema.shape,
});

// File upload validation (for multipart forms)
export const fileValidation = {
  image: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z
      .string()
      .refine((type) => type.startsWith("image/"), "File must be an image"),
    size: z.number().max(5 * 1024 * 1024, "File size cannot exceed 5MB"),
  }),

  document: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z
      .string()
      .refine(
        (type) =>
          [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ].includes(type),
        "File must be a PDF or Word document",
      ),
    size: z.number().max(10 * 1024 * 1024, "File size cannot exceed 10MB"),
  }),
};

export type PaginationInput = z.TypeOf<typeof paginationSchema>;
export type SearchInput = z.TypeOf<typeof searchSchema>;
