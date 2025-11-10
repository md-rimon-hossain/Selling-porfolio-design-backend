"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileValidation = exports.searchSchema = exports.paginationSchema = exports.createPasswordConfirmationSchema = exports.commonValidation = void 0;
const zod_1 = require("zod");
// Common validation patterns
exports.commonValidation = {
    // MongoDB ObjectId validation
    objectId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
    // Email validation
    email: zod_1.z.string().email("Please provide a valid email address").toLowerCase(),
    // Password validation with requirements
    password: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password cannot exceed 100 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    // URL validation
    url: zod_1.z.string().url("Please provide a valid URL"),
    // Phone number validation (basic)
    phone: zod_1.z
        .string()
        .regex(/^\+?[\d\s\-()]+$/, "Please provide a valid phone number"),
    // Positive number validation
    positiveNumber: zod_1.z.number().min(0, "Value must be a positive number"),
    // Price validation
    price: zod_1.z
        .number()
        .min(0, "Price cannot be negative")
        .max(999999.99, "Price cannot exceed $999,999.99"),
    // Required string with length constraints
    requiredString: (minLength = 1, maxLength = 255) => zod_1.z
        .string()
        .min(minLength, `Must be at least ${minLength} characters long`)
        .max(maxLength, `Cannot exceed ${maxLength} characters`)
        .trim(),
    // Optional string with length constraints
    optionalString: (minLength = 1, maxLength = 255) => zod_1.z
        .string()
        .min(minLength, `Must be at least ${minLength} characters long`)
        .max(maxLength, `Cannot exceed ${maxLength} characters`)
        .trim()
        .optional(),
    // Array validation with size constraints
    arrayWithMinMax: (itemSchema, min = 1, max = 100) => zod_1.z
        .array(itemSchema)
        .min(min, `Must have at least ${min} item(s)`)
        .max(max, `Cannot exceed ${max} items`),
    // Date validation
    futureDate: zod_1.z
        .string()
        .datetime("Please provide a valid date")
        .refine((date) => new Date(date) > new Date(), {
        message: "Date must be in the future",
    }),
    pastDate: zod_1.z
        .string()
        .datetime("Please provide a valid date")
        .refine((date) => new Date(date) < new Date(), {
        message: "Date must be in the past",
    }),
    // Enum validation helper
    createEnum: (values, fieldName) => zod_1.z.enum(values, {
        required_error: `${fieldName} is required`,
        invalid_type_error: `${fieldName} must be one of: ${values.join(", ")}`,
    }),
};
// Password confirmation validation helper
const createPasswordConfirmationSchema = (passwordField = "password") => zod_1.z
    .object({
    [passwordField]: exports.commonValidation.password,
    confirmPassword: zod_1.z.string({
        required_error: "Password confirmation is required",
    }),
})
    .refine((data) => data[passwordField] === data.confirmPassword, {
    message: "Password and confirmation password do not match",
    path: ["confirmPassword"],
});
exports.createPasswordConfirmationSchema = createPasswordConfirmationSchema;
// Pagination validation schema
exports.paginationSchema = zod_1.z.object({
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
        .string()
        .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid sort field")
        .optional(),
    sortOrder: zod_1.z
        .enum(["asc", "desc"], {
        invalid_type_error: "Sort order must be 'asc' or 'desc'",
    })
        .default("desc"),
});
// Search validation schema
exports.searchSchema = zod_1.z.object(Object.assign({ q: zod_1.z
        .string()
        .min(1, "Search query cannot be empty")
        .max(100, "Search query cannot exceed 100 characters")
        .optional() }, exports.paginationSchema.shape));
// File upload validation (for multipart forms)
exports.fileValidation = {
    image: zod_1.z.object({
        fieldname: zod_1.z.string(),
        originalname: zod_1.z.string(),
        encoding: zod_1.z.string(),
        mimetype: zod_1.z
            .string()
            .refine((type) => type.startsWith("image/"), "File must be an image"),
        size: zod_1.z.number().max(5 * 1024 * 1024, "File size cannot exceed 5MB"),
    }),
    document: zod_1.z.object({
        fieldname: zod_1.z.string(),
        originalname: zod_1.z.string(),
        encoding: zod_1.z.string(),
        mimetype: zod_1.z
            .string()
            .refine((type) => [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(type), "File must be a PDF or Word document"),
        size: zod_1.z.number().max(10 * 1024 * 1024, "File size cannot exceed 10MB"),
    }),
};
