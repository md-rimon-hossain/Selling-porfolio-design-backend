import { Schema, model } from "mongoose";
import type {
  ICourseEnrollment,
  INote,
  IProgress,
} from "./courseEnrollment.interface";

const noteSchema = new Schema<INote>(
  {
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
  },
  { _id: true },
);

const progressSchema = new Schema<IProgress>(
  {
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
  },
  { _id: false },
);

const courseEnrollmentSchema = new Schema<ICourseEnrollment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
      index: true,
    },
    purchase: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

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

export const CourseEnrollment = model<ICourseEnrollment>(
  "CourseEnrollment",
  courseEnrollmentSchema,
);
