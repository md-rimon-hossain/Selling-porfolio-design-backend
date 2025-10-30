"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
// Create the schema
const reviewSchema = new mongoose_1.Schema({
    reviewer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Reviewer is required"],
    },
    design: { type: mongoose_1.Schema.Types.ObjectId, ref: "Design" }, // 💡 Optional
    course: { type: mongoose_1.Schema.Types.ObjectId, ref: "Course" }, // 💡 NEW FIELD
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
}, {
    timestamps: true,
    versionKey: false,
});
// 💡 Validation and Indexes for Design OR Course
reviewSchema.pre("validate", function (next) {
    // Ensures exactly one of design or course is provided.
    if (!!this.design === !!this.course) {
        return next(new Error("A review must reference exactly one Design or one Course."));
    }
    next();
});
reviewSchema.index({ reviewer: 1, design: 1 }, { unique: true, partialFilterExpression: { design: { $exists: true } } });
// 2. Prevent duplicate reviews from the same user for the same Course (NEW)
reviewSchema.index({ reviewer: 1, course: 1 }, { unique: true, partialFilterExpression: { course: { $exists: true } } });
// Export the model
exports.Review = (0, mongoose_1.model)("Review", reviewSchema);
