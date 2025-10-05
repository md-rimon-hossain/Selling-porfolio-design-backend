import { Schema, model } from "mongoose";
import type { IDesign } from "./design.interface";

const designSchema = new Schema<IDesign>(
  {
    title: {
      type: String,
      required: [true, "Design title is required"],
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    previewImageUrl: {
      type: String,
      required: [true, "Preview image URL is required"],
    },
    designerName: {
      type: String,
      required: [true, "Designer name is required"],
      trim: true,
    },
    usedTools: [
      {
        type: String,
        trim: true,
      },
    ],
    effectsUsed: [
      {
        type: String,
        trim: true,
      },
    ],
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    processDescription: {
      type: String,
      required: [true, "Process description is required"],
    },
    complexityLevel: {
      type: String,
      enum: ["Basic", "Intermediate", "Advanced"],
      required: [true, "Complexity level is required"],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Draft",
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Add index for better search performance
designSchema.index({ title: "text", description: "text", tags: "text" });
designSchema.index({ status: 1, category: 1 });

export const Design = model<IDesign>("Design", designSchema);
