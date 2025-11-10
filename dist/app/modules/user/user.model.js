"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"],
        select: false,
    },
    role: {
        type: String,
        enum: ["super_admin", "admin", "customer", "designer", "instructor"],
        default: "customer",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    profileImage: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.User = (0, mongoose_1.model)("User", userSchema);
