import { Schema, model, Types } from "mongoose";

// Define the interface for Review
export interface IReview {
  _id?: string;
  reviewer: Types.ObjectId;
  design?: Types.ObjectId; // Design being reviewed
  // 💡 NEW FIELD: Optional course reference for reviews related to courses
  course?: Types.ObjectId; // 💡 NEW FIELD
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
    design: { type: Schema.Types.ObjectId, ref: "Design" }, // 💡 Optional
    course: { type: Schema.Types.ObjectId, ref: "Course" }, // 💡 NEW FIELD
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
  },
);

// 💡 Validation and Indexes for Design OR Course
reviewSchema.pre("validate", function (next) {
  // Ensures exactly one of design or course is provided.
  if (!!this.design === !!this.course) {
    return next(
      new Error("A review must reference exactly one Design or one Course."),
    );
  }
  next();
});

reviewSchema.index(
  { reviewer: 1, design: 1 },
  { unique: true, partialFilterExpression: { design: { $exists: true } } },
);

// 2. Prevent duplicate reviews from the same user for the same Course (NEW)
reviewSchema.index(
  { reviewer: 1, course: 1 },
  { unique: true, partialFilterExpression: { course: { $exists: true } } },
);
// Export the model
export const Review = model<IReview>("Review", reviewSchema);
