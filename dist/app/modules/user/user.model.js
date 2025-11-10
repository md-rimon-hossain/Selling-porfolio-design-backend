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
        // Password only required for local auth (not OAuth)
        required: function () {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return this.authProvider === "local";
        },
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
    // OAuth fields
    googleId: {
        type: String,
        sparse: true,
        index: true,
    },
    githubId: {
        type: String,
        sparse: true,
        index: true,
    },
    authProvider: {
        type: String,
        enum: ["local", "google", "github"],
        default: "local",
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.User = (0, mongoose_1.model)("User", userSchema);
