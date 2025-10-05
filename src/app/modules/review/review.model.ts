import { Schema, model, Types } from "mongoose";

// Define the interface for Review
export interface IReview {
  _id?: string;
  reviewer: Types.ObjectId;
  design: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const reviewSchema = new Schema<IReview>(
  {
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer is required"],
    },
    design: {
      type: Schema.Types.ObjectId,
      ref: "Design",
      required: [true, "Design is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate reviews from same user for same design
reviewSchema.index({ reviewer: 1, design: 1 }, { unique: true });

// Export the model
export const Review = model<IReview>("Review", reviewSchema);
