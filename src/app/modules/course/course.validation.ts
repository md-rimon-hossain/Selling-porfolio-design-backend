import { z } from "zod";

// Video Segment Validation
export const videoSegmentSchema = z.object({
  segmentTitle: z.string().min(1, "Segment title is required"),
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
  youtubeVideoId: z.string().min(1, "YouTube Video ID is required"),
  isFreePreview: z.boolean().default(false),
});

// Module Validation
export const moduleSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  description: z.string().optional(),
  lessons: z
    .array(videoSegmentSchema)
    .min(1, "Module must have at least one lesson"),
  moduleDurationMinutes: z.number().min(0).default(0),
});

// Create Course Validation
export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    mainCategory: z.string().min(1, "Main category is required"),
    subCategory: z.string().optional(),
    instructor: z.string().optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    thumbnailImageUrl: z.string().url("Invalid thumbnail URL"),
    modules: z
      .array(moduleSchema)
      .min(1, "Course must have at least one module"),
    basePrice: z.number().min(0, "Base price cannot be negative"),
    discountedPrice: z.number().min(0).optional(),
    level: z.enum(["Beginner", "Intermediate", "Expert"]),
    tags: z.array(z.string()).default([]),
    status: z.enum(["Active", "Draft", "Archived"]).default("Draft"),
  }),
});

// Update Course Validation
export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    mainCategory: z.string().optional(),
    subCategory: z.string().optional(),
    description: z.string().min(10).optional(),
    thumbnailImageUrl: z.string().url().optional(),
    modules: z.array(moduleSchema).min(1).optional(),
    basePrice: z.number().min(0).optional(),
    discountedPrice: z.number().min(0).optional(),
    level: z.enum(["Beginner", "Intermediate", "Expert"]).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(["Active", "Draft", "Archived"]).optional(),
  }),
});

// Query Parameters Validation
export const courseQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    search: z.string().optional(),
    mainCategory: z.string().optional(),
    subCategory: z.string().optional(),
    instructor: z.string().optional(),
    level: z.enum(["Beginner", "Intermediate", "Expert"]).optional(),
    status: z.enum(["Active", "Draft", "Archived"]).optional(),
    minPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .transform(Number)
      .optional(),
    maxPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .transform(Number)
      .optional(),
    tags: z
      .string()
      .transform((val) => val.split(","))
      .optional(),
  }),
});

// Enrollment Validation
export const enrollInCourseSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, "Course ID is required"),
    purchaseId: z.string().optional(),
  }),
});

// Progress Update Validation
export const updateProgressSchema = z.object({
  body: z.object({
    moduleIndex: z.number().min(0, "Module index must be non-negative"),
    lessonIndex: z.number().min(0, "Lesson index must be non-negative"),
    completed: z.boolean(),
    watchedDuration: z.number().min(0).optional(),
  }),
});

// Note Operations Validation
export const addNoteSchema = z.object({
  body: z.object({
    moduleIndex: z.number().min(0),
    lessonIndex: z.number().min(0),
    timestamp: z.number().min(0, "Timestamp must be non-negative"),
    content: z.string().min(1, "Note content is required"),
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Note content is required"),
  }),
});

// ID Parameter Validation
export const courseIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Course ID is required"),
  }),
});

export const enrollmentIdParamSchema = z.object({
  params: z.object({
    enrollmentId: z.string().min(1, "Enrollment ID is required"),
  }),
});

export const noteIdParamSchema = z.object({
  params: z.object({
    enrollmentId: z.string().min(1, "Enrollment ID is required"),
    noteId: z.string().min(1, "Note ID is required"),
  }),
});
