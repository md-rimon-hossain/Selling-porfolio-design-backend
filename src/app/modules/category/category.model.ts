import { Schema, Types, model } from "mongoose";

export interface ICategory {
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
  categoryType: "design" | "course";
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
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      index: true,
    },
    categoryType: {
      type: String,
      enum: ["design", "course"],
      required: [true, "Category type is required"],
      default: "design",
      index: true,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Simple slugify util to avoid an extra dependency
function simpleSlugify(input: string) {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Ensure slug is set before save with categoryType prefix
categorySchema.pre("save", function (next) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = this as any;
  if (doc.isModified("name") || !doc.slug) {
    const baseSlug = simpleSlugify(doc.name);
    doc.slug = `${doc.categoryType}-${baseSlug}`;
  }
  next();
});

// Add compound unique index for name + categoryType
categorySchema.index({ name: 1, categoryType: 1 }, { unique: true });
categorySchema.index({ slug: 1 }, { unique: true });

// Create a virtual to populate subcategories easily
categorySchema.virtual("subcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parentCategory",
  justOne: false,
});

// Tidy up JSON output for frontend: map _id -> id and remove internal flags
categorySchema.set("toJSON", {
  virtuals: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(doc: any, ret: any) {
    // convert ObjectId to string id
    ret.id = ret._id?.toString?.() ?? ret._id;
    delete ret._id;
    // remove mongoose's internal fields
    delete ret.__v;
    // don't expose isDeleted flag to frontend
    delete ret.isDeleted;
    return ret;
  },
});

categorySchema.set("toObject", { virtuals: true });

export const Category = model<ICategory>("Category", categorySchema);
