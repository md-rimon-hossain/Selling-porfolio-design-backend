import { Schema, model, Document } from "mongoose";

export interface ILike extends Document {
  user: Schema.Types.ObjectId;
  design: Schema.Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    design: {
      type: Schema.Types.ObjectId,
      ref: "Design",
      required: [true, "Design reference is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Create compound index to ensure one user can only like a design once
likeSchema.index({ user: 1, design: 1 }, { unique: true });

export const Like = model<ILike>("Like", likeSchema);
