import type { Types } from "mongoose";

export interface INote {
  _id?: string;
  moduleIndex: number;
  lessonIndex: number;
  timestamp: number; // Video timestamp in seconds
  content: string;
  createdAt: Date;
}

export interface IProgress {
  completedLessons: string[]; // Format: "moduleIndex-lessonIndex"
  currentModule: number;
  currentLesson: number;
  overallProgress: number; // Percentage (0-100)
  lastAccessedAt: Date;
}

export interface ICourseEnrollment {
  _id?: string;
  student: Types.ObjectId;
  course: Types.ObjectId;
  purchase?: Types.ObjectId; // Reference to purchase record
  enrolledAt: Date;
  completedAt?: Date;
  status: "active" | "completed" | "suspended";
  progress: IProgress;
  notes: INote[];
  certificateIssued: boolean;
  certificateIssuedAt?: Date;
  lastAccessedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
