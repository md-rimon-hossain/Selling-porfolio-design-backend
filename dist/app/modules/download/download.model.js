"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Download = void 0;
const mongoose_1 = require("mongoose");
// Create the schema
const downloadSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
    },
    design: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Design",
        required: [true, "Design is required"],
    },
    downloadType: {
        type: String,
        required: [true, "Download type is required"],
        enum: ["individual_purchase", "subscription"],
    },
    purchase: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    versionKey: false,
});
// Create indexes for better performance
downloadSchema.index({ user: 1, design: 1 });
downloadSchema.index({ user: 1, downloadDate: -1 });
downloadSchema.index({ design: 1, downloadDate: -1 });
// Export the model
exports.Download = (0, mongoose_1.model)("Download", downloadSchema);
