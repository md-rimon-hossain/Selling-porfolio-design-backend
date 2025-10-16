import { z } from "zod";

// Purchase creation validation schema
export const createPurchaseSchema = z
  .object({
    body: z.object({
      purchaseType: z.enum(["individual", "subscription"], {
        required_error: "Purchase type is required",
        invalid_type_error:
          "Purchase type must be 'individual' or 'subscription'",
      }),

      design: z
        .string({
          required_error: "Design ID is required for individual purchases",
        })
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format")
        .optional(),

      pricingPlan: z
        .string({
          required_error:
            "Pricing plan ID is required for subscription purchases",
        })
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid pricing plan ID format")
        .optional(),

      paymentMethod: z
        .enum(["credit_card", "paypal", "stripe", "bank_transfer", "free"], {
          required_error: "Payment method is required",
          invalid_type_error:
            "Payment method must be credit_card, paypal, stripe, bank_transfer, or free",
        })
        .optional(),

      paymentDetails: z
        .object({
          cardNumber: z.string().optional(),
          expiryDate: z.string().optional(),
          cvv: z.string().optional(),
          cardholderName: z.string().optional(),
          paypalEmail: z.string().email().optional(),
          bankAccountNumber: z.string().optional(),
        }),
        
      currency: z
        .string()
        .length(3, "Currency must be 3 characters")
        .optional(),

      billingAddress: z
        .object({
          street: z.string().min(1, "Street is required"),
          city: z.string().min(1, "City is required"),
          state: z.string().min(1, "State is required"),
          zipCode: z.string().min(1, "Zip code is required"),
          country: z.string().min(1, "Country is required"),
        })
        .optional(),

      notes: z
        .string()
        .max(500, "Notes cannot exceed 500 characters")
        .optional(),
    }),
  })
  .refine(
    (data) => {
      // For individual purchases, design is required
      if (data.body.purchaseType === "individual" && !data.body.design) {
        return false;
      }
      // For subscription purchases, pricingPlan is required
      if (data.body.purchaseType === "subscription" && !data.body.pricingPlan) {
        return false;
      }
      return true;
    },
    {
      message:
        "Design ID is required for individual purchases, and Pricing Plan ID is required for subscription purchases",
    },
  );

// Purchase update validation schema (for admin/payment status updates)
export const updatePurchaseSchema = z.object({
  body: z.object({
    status: z
      .enum(["pending", "completed", "expired", "cancelled", "refunded"], {
        invalid_type_error:
          "Status must be pending, completed, expired, cancelled, or refunded",
      })
      .optional(),

    adminNotes: z
      .string()
      .max(500, "Admin notes cannot exceed 500 characters")
      .optional(),
  }),
});

// Purchase cancellation validation schema
export const cancelPurchaseSchema = z.object({
  body: z.object({
    cancelReason: z
      .string()
      .max(200, "Cancel reason cannot exceed 200 characters")
      .optional(),
  }),
});

// Purchase query parameters validation schema
export const purchaseQuerySchema = z.object({
  query: z.object({
    paymentStatus: z.enum(["Pending", "Paid", "Cancelled"]).optional(),
    purchaseType: z.enum(["individual", "subscription"]).optional(),
    status: z
      .enum(["pending", "completed", "expired", "cancelled", "refunded"])
      .optional(),
    customer: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid customer ID format")
      .optional(),

    design: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format")
      .optional(),

    startDate: z.string().datetime("Invalid start date format").optional(),

    endDate: z.string().datetime("Invalid end date format").optional(),

    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine(
        (val) => !isNaN(val) && val > 0,
        "Page must be a positive integer",
      )
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
      .enum(["purchaseDate", "createdAt", "updatedAt"])
      .default("purchaseDate"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// MongoDB ObjectId validation for params
export const purchaseParamsSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Purchase ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid purchase ID format"),
  }),
});

// Purchase analytics validation schema
export const purchaseAnalyticsSchema = z.object({
  query: z.object({
    period: z
      .enum(["daily", "weekly", "monthly", "yearly"], {
        invalid_type_error: "Period must be daily, weekly, monthly, or yearly",
      })
      .default("monthly"),

    startDate: z.string().datetime("Invalid start date format").optional(),

    endDate: z.string().datetime("Invalid end date format").optional(),

    designId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid design ID format")
      .optional(),
  }),
});

export type CreatePurchaseInput = z.TypeOf<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.TypeOf<typeof updatePurchaseSchema>;
export type PurchaseQueryInput = z.TypeOf<typeof purchaseQuerySchema>;
export type PurchaseParamsInput = z.TypeOf<typeof purchaseParamsSchema>;
export type PurchaseAnalyticsInput = z.TypeOf<typeof purchaseAnalyticsSchema>;
