import { z } from "zod";

/**
 * Schema for creating a payment
 * Supports designs, courses, and subscriptions
 */
export const createPaymentSchema = z.object({
  productType: z.enum(["design", "course", "subscription"], {
    errorMap: () => ({
      message: "Product type must be design, course, or subscription",
    }),
  }),
  productId: z.string().min(1, "Product ID is required"),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters (e.g., USD, BDT)")
    .optional()
    .default("usd"),
});

/**
 * Schema for confirming a payment (webhook use)
 */
export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment intent ID is required"),
});

/**
 * Schema for refunding a payment
 */
export const refundPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment intent ID is required"),
  amount: z.number().positive("Amount must be positive").optional(),
  reason: z.string().min(1, "Reason is required").optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
