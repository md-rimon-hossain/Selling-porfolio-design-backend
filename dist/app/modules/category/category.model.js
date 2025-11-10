"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        trim: true,
        index: true,
    },
    parentCategory: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Simple slugify util to avoid an extra dependency
function simpleSlugify(input) {
    return input
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}
// Ensure slug is set before save
categorySchema.pre("save", function (next) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = this;
    if (doc.isModified("name") || !doc.slug) {
        doc.slug = simpleSlugify(doc.name);
    }
    next();
});
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
    transform(doc, ret) {
        var _a, _b, _c;
        // convert ObjectId to string id
        ret.id = (_c = (_b = (_a = ret._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : ret._id;
        delete ret._id;
        // remove mongoose's internal fields
        delete ret.__v;
        // don't expose isDeleted flag to frontend
        delete ret.isDeleted;
        return ret;
    },
});
categorySchema.set("toObject", { virtuals: true });
exports.Category = (0, mongoose_1.model)("Category", categorySchema);
