import { Schema, model } from "mongoose";

// Define the interface for PricingPlan
export interface IPricingPlan {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  finalPrice?: number;
  currencyCode: string;
  currencyDisplay: string;
  features: string[];
  duration: string;
  maxDesigns?: number;
  maxDownloads?: number;
  priority?: number;
  isActive: boolean;
  discountPercentage?: number;
  validUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const pricingPlanSchema = new Schema<IPricingPlan>(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    finalPrice: {
      type: Number,
      min: [0, "Final price cannot be negative"],
    },
    currencyCode: {
      type: String,
      required: [true, "Currency code is required"],
      uppercase: true,
      trim: true,
      default: "usd",
    },
    currencyDisplay: {
      type: String,
      required: [true, "Currency display string is required"],
      trim: true,
      default: "$", // Common display symbol for usd (e.g., '$' is another option)
    },
    features: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    duration: {
      type: String,
      required: [true, "Duration is required"],
      trim: true,
    },
    maxDesigns: {
      type: Number,
      min: [1, "Max designs must be at least 1"],
    },
    maxDownloads: {
      type: Number,
      min: [1, "Max downloads must be at least 1"],
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, "Priority must be at least 1"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, "Discount percentage cannot be negative"],
      max: [100, "Discount percentage cannot exceed 100"],
    },
    validUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Export the model
export const PricingPlan = model<IPricingPlan>(
  "PricingPlan",
  pricingPlanSchema,
);
