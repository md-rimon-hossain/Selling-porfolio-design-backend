"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseEnrollment = void 0;
const mongoose_1 = require("mongoose");
const noteSchema = new mongoose_1.Schema({
    moduleIndex: {
        type: Number,
        required: true,
        min: 0,
    },
    lessonIndex: {
        type: Number,
        required: true,
        min: 0,
    },
    timestamp: {
        type: Number,
        required: true,
        min: 0,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: true });
const progressSchema = new mongoose_1.Schema({
    completedLessons: {
        type: [String],
        default: [],
    },
    currentModule: {
        type: Number,
        default: 0,
        min: 0,
    },
    currentLesson: {
        type: Number,
        default: 0,
        min: 0,
    },
    overallProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });
const courseEnrollmentSchema = new mongoose_1.Schema({
    student: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Student reference is required"],
        index: true,
    },
    course: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Course reference is required"],
        index: true,
    },
    purchase: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Purchase",
    },
    enrolledAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    completedAt: {
        type: Date,
    },
    status: {
        type: String,
        enum: ["active", "completed", "suspended"],
        default: "active",
        index: true,
    },
    progress: {
        type: progressSchema,
        required: true,
        default: () => ({
            completedLessons: [],
            currentModule: 0,
            currentLesson: 0,
            overallProgress: 0,
            lastAccessedAt: new Date(),
        }),
    },
    notes: {
        type: [noteSchema],
        default: [],
    },
    certificateIssued: {
        type: Boolean,
        default: false,
    },
    certificateIssuedAt: {
        type: Date,
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Compound index for unique enrollment
courseEnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
// Index for querying enrollments by status and date
courseEnrollmentSchema.index({ status: 1, enrolledAt: -1 });
courseEnrollmentSchema.index({ student: 1, status: 1 });
// Update lastAccessedAt on save
courseEnrollmentSchema.pre("save", function (next) {
    this.lastAccessedAt = new Date();
    next();
});
exports.CourseEnrollment = (0, mongoose_1.model)("CourseEnrollment", courseEnrollmentSchema);
