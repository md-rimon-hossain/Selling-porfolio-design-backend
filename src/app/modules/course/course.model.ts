// file: course.model.ts

import { Schema, model } from "mongoose";
import type { ICourse, IModule, IVideoSegment } from "./course.interface";

// 1. Embedded Schema for Video Segments (Lessons)
const videoSegmentSchema = new Schema<IVideoSegment>(
  {
    segmentTitle: {
      type: String,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    youtubeVideoId: {
      type: String,
      required: [true, "YouTube Video ID is required"],
      trim: true,
    },
    isFreePreview: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

// 2. Embedded Schema for Modules (Chapters)
const moduleSchema = new Schema<IModule>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },

    // 💡 ARRAY OF VIDEO SEGMENTS
    lessons: {
      type: [videoSegmentSchema],
      required: [true, "A module must contain at least one lesson"],
    },

    moduleDurationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

// Pre-save hook for module calculation
moduleSchema.pre("save", function (next) {
  if (this.lessons && this.isModified("lessons")) {
    this.moduleDurationMinutes = this.lessons.reduce(
      (sum, lesson) => sum + lesson.durationMinutes,
      0,
    );
  }
  next();
});

// 3. Main Course Schema
const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },

    // Category Links
    mainCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: false,
      index: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailImageUrl: {
      type: String,
      required: true,
    },

    // Course Content (Modules)
    modules: {
      type: [moduleSchema],
      required: true,
    },
    totalDurationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Pricing
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedPrice: {
      type: Number,
      min: 0,
    },

    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Expert"],
      required: true,
    },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Draft",
    },

    // Metrics
    enrollmentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true, versionKey: false },
);

// Final Pre-save hook for total course duration
courseSchema.pre("save", function (next) {
  if (this.modules && (this.isModified("modules") || this.isNew)) {
    // We rely on the moduleSchema pre-save hook to calculate moduleDurationMinutes
    this.totalDurationMinutes = this.modules.reduce(
      (sum, mod) => sum + mod.moduleDurationMinutes,
      0,
    );
  }
  next();
});

export const Course = model<ICourse>("Course", courseSchema);
