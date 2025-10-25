"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeQuerySchema = exports.likeParamsSchema = void 0;
const zod_1 = require("zod");
// Like params validation schema
exports.likeParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        designId: zod_1.z
            .string({
            required_error: "Design ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format"),
    }),
});
// Like query validation schema
exports.likeQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
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
    }),
});
