"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Like = void 0;
const mongoose_1 = require("mongoose");
const likeSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"],
    },
    design: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Design",
        required: [true, "Design reference is required"],
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Create compound index to ensure one user can only like a design once
likeSchema.index({ user: 1, design: 1 }, { unique: true });
exports.Like = (0, mongoose_1.model)("Like", likeSchema);
