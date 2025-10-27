import { Schema, Types, model } from "mongoose";

export interface ICategory {
  _id?: string;
  name: string;
  description?: string;
  isActive: boolean;
  parentCategory?: Types.ObjectId;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category", // Crucial: It refers to itself
      default: null, // Main categories will have null here
      index: true, // Good for querying subcategories
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Category = model<ICategory>("Category", categorySchema);
