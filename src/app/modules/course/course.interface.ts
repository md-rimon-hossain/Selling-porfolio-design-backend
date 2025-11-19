// file: course.interface.ts

import type { Types } from "mongoose";

export interface IVideoSegment {
  segmentTitle: string;
  durationMinutes: number;
  /** The unique identifier for the video on YouTube (e.g., 'dQw4w9WgXcQ'). */
  youtubeVideoId: string;
  isFreePreview: boolean;
}

export interface IModule {
  title: string;
  description?: string;

  /** 💡 NEW: Array of video segments/lessons within this module. */
  lessons: IVideoSegment[];

  /** Total calculated duration of all lessons in this module. */
  moduleDurationMinutes: number;
}

export interface ICourse {
  _id?: string;
  title: string;

  mainCategory: Types.ObjectId;
  subCategory?: Types.ObjectId;
  instructor: Types.ObjectId;

  description: string;
  thumbnailImageUrl: string;

  modules: IModule[]; // Now contains IModule with lessons
  totalDurationMinutes: number; // Calculated field (sum of all module durations)

  basePrice: number;
  discountedPrice?: number;

  level: "Beginner" | "Intermediate" | "Expert";
  tags: string[];
  status: "Active" | "Draft" | "Archived";

  enrollmentCount: number;
  likesCount: number;
  averageRating: number;

  createdAt?: Date;
  updatedAt?: Date;
}
