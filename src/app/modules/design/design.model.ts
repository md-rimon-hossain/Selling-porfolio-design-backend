import { Schema, model } from "mongoose";
import type { IDesign, IDownloadableFile } from "./design.interface";

// 1. Embedded Schema for Downloadable File Details
const downloadableFileSchema = new Schema<IDownloadableFile>(
  {
    public_id: {
      type: String,
      required: [true, "Downloadable file Public ID is required"],
    },
    secure_url: {
      type: String,
      required: [true, "Secure URL for the downloadable file is required"],
    },
    file_format: {
      type: String,
      required: [true, "File format is required"],
    },
    file_size: {
      type: Number,
      required: [true, "File size in bytes is required"],
    },
  },
  { _id: false },
);

const designSchema = new Schema<IDesign>(
  {
    title: {
      type: String,
      required: [true, "Design title is required"],
      trim: true,
    },

    // Category Hierarchy
    mainCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Main category reference ID is required"],
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Sub category reference ID is required"],
    },

    designer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Designer reference ID is required"],
    },

    // Design Classification
    designType: {
      type: String,
      enum: [
        "Logo",
        "Poster",
        "UI/UX Design",
        "Presentation",
        "Print/Packaging",
        "Illustration/Art",
        "Social Media Graphic",
        "Other",
      ],
      required: [true, "Design type is required"],
      index: true,
    },

    // Visuals
    previewImageUrls: [
      {
        type: String,
        required: [true, "At least one preview image URL is required"],
        trim: true,
      },
    ],

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    // Pricing
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Base price cannot be negative"],
    },

    discountedPrice: {
      type: Number,
      required: [true, "Discounted price is required"],
      min: [0, "Discounted price cannot be negative"],
    },

    includedFormats: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],
    // Tools & Effects
    usedTools: [{ type: String, trim: true }],
    effectsUsed: [{ type: String, trim: true }],

    // Downloadable File
    downloadableFile: {
      type: downloadableFileSchema,
      required: [true, "Downloadable file details are required"],
    },

    // Metadata
    processDescription: {
      type: String,
      required: [true, "Process description is required"],
    },
    complexityLevel: {
      type: String,
      enum: ["Basic", "Intermediate", "Advanced"],
      required: [true, "Complexity level is required"],
    },
    tags: [{ type: String, trim: true }],

    // Management & Stats
    status: {
      type: String,
      enum: ["Active", "Pending", "Rejected", "Inactive"],
      default: "Active",
    },
    isDeleted: { type: Boolean, default: false, select: false },
    likesCount: { type: Number, default: 0, min: 0 },
    downloadCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Add index for better search performance
designSchema.index({ title: "text", description: "text", tags: "text" });
designSchema.index({ status: 1, mainCategory: 1, subCategory: 1 });

export const Design = model<IDesign>("Design", designSchema);
