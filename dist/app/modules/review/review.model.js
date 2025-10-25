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
    design: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    versionKey: false,
});
// Prevent duplicate reviews from same user for same design
reviewSchema.index({ reviewer: 1, design: 1 }, { unique: true });
// Export the model
exports.Review = (0, mongoose_1.model)("Review", reviewSchema);
