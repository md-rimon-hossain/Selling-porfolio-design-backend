import { Schema, model, Types } from "mongoose";

// Define the interface for Download
export interface IDownload {
  _id?: string;
  user: Types.ObjectId;
  design: Types.ObjectId;
  downloadType: "individual_purchase" | "subscription";
  purchase?: Types.ObjectId; // Reference to the purchase (individual or subscription)
  downloadDate: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const downloadSchema = new Schema<IDownload>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    design: {
      type: Schema.Types.ObjectId,
      ref: "Design",
      required: [true, "Design is required"],
    },
    downloadType: {
      type: String,
      required: [true, "Download type is required"],
      enum: ["individual_purchase", "subscription"],
    },
    purchase: {
      type: Schema.Types.ObjectId,
      ref: "Purchase",
      required: [true, "Purchase reference is required"],
    },
    downloadDate: {
      type: Date,
      default: Date.now,
      required: [true, "Download date is required"],
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Create indexes for better performance
downloadSchema.index({ user: 1, design: 1 });
downloadSchema.index({ user: 1, downloadDate: -1 });
downloadSchema.index({ design: 1, downloadDate: -1 });

// Export the model
export const Download = model<IDownload>("Download", downloadSchema);
