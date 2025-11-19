"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteIdParamSchema = exports.enrollmentIdParamSchema = exports.courseIdParamSchema = exports.updateNoteSchema = exports.addNoteSchema = exports.updateProgressSchema = exports.enrollInCourseSchema = exports.courseQuerySchema = exports.updateCourseSchema = exports.createCourseSchema = exports.moduleSchema = exports.videoSegmentSchema = void 0;
const zod_1 = require("zod");
// Video Segment Validation
exports.videoSegmentSchema = zod_1.z.object({
    segmentTitle: zod_1.z.string().min(1, "Segment title is required"),
    durationMinutes: zod_1.z.number().min(1, "Duration must be at least 1 minute"),
    youtubeVideoId: zod_1.z.string().min(1, "YouTube Video ID is required"),
    isFreePreview: zod_1.z.boolean().default(false),
});
// Module Validation
exports.moduleSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Module title is required"),
    description: zod_1.z.string().optional(),
    lessons: zod_1.z
        .array(exports.videoSegmentSchema)
        .min(1, "Module must have at least one lesson"),
    moduleDurationMinutes: zod_1.z.number().min(0).default(0),
});
// Create Course Validation
exports.createCourseSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, "Title must be at least 3 characters"),
        mainCategory: zod_1.z.string().min(1, "Main category is required"),
        subCategory: zod_1.z.string().min(1, "Sub category is required"),
        instructor: zod_1.z.string().min(1, "Instructor ID is required"),
        description: zod_1.z
            .string()
            .min(10, "Description must be at least 10 characters"),
        thumbnailImageUrl: zod_1.z.string().url("Invalid thumbnail URL"),
        modules: zod_1.z
            .array(exports.moduleSchema)
            .min(1, "Course must have at least one module"),
        basePrice: zod_1.z.number().min(0, "Base price cannot be negative"),
        discountedPrice: zod_1.z.number().min(0).optional(),
        level: zod_1.z.enum(["Beginner", "Intermediate", "Expert"]),
        tags: zod_1.z.array(zod_1.z.string()).default([]),
        status: zod_1.z.enum(["Active", "Draft", "Archived"]).default("Draft"),
    }),
});
// Update Course Validation
exports.updateCourseSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        mainCategory: zod_1.z.string().optional(),
        subCategory: zod_1.z.string().optional(),
        description: zod_1.z.string().min(10).optional(),
        thumbnailImageUrl: zod_1.z.string().url().optional(),
        modules: zod_1.z.array(exports.moduleSchema).min(1).optional(),
        basePrice: zod_1.z.number().min(0).optional(),
        discountedPrice: zod_1.z.number().min(0).optional(),
        level: zod_1.z.enum(["Beginner", "Intermediate", "Expert"]).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        status: zod_1.z.enum(["Active", "Draft", "Archived"]).optional(),
    }),
});
// Query Parameters Validation
exports.courseQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
        search: zod_1.z.string().optional(),
        mainCategory: zod_1.z.string().optional(),
        subCategory: zod_1.z.string().optional(),
        instructor: zod_1.z.string().optional(),
        level: zod_1.z.enum(["Beginner", "Intermediate", "Expert"]).optional(),
        status: zod_1.z.enum(["Active", "Draft", "Archived"]).optional(),
        minPrice: zod_1.z
            .string()
            .regex(/^\d+(\.\d+)?$/)
            .transform(Number)
            .optional(),
        maxPrice: zod_1.z
            .string()
            .regex(/^\d+(\.\d+)?$/)
            .transform(Number)
            .optional(),
        tags: zod_1.z
            .string()
            .transform((val) => val.split(","))
            .optional(),
    }),
});
// Enrollment Validation
exports.enrollInCourseSchema = zod_1.z.object({
    body: zod_1.z.object({
        courseId: zod_1.z.string().min(1, "Course ID is required"),
        purchaseId: zod_1.z.string().optional(),
    }),
});
// Progress Update Validation
exports.updateProgressSchema = zod_1.z.object({
    body: zod_1.z.object({
        moduleIndex: zod_1.z.number().min(0, "Module index must be non-negative"),
        lessonIndex: zod_1.z.number().min(0, "Lesson index must be non-negative"),
        completed: zod_1.z.boolean(),
        watchedDuration: zod_1.z.number().min(0).optional(),
    }),
});
// Note Operations Validation
exports.addNoteSchema = zod_1.z.object({
    body: zod_1.z.object({
        moduleIndex: zod_1.z.number().min(0),
        lessonIndex: zod_1.z.number().min(0),
        timestamp: zod_1.z.number().min(0, "Timestamp must be non-negative"),
        content: zod_1.z.string().min(1, "Note content is required"),
    }),
});
exports.updateNoteSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1, "Note content is required"),
    }),
});
// ID Parameter Validation
exports.courseIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, "Course ID is required"),
    }),
});
exports.enrollmentIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        enrollmentId: zod_1.z.string().min(1, "Enrollment ID is required"),
    }),
});
exports.noteIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        enrollmentId: zod_1.z.string().min(1, "Enrollment ID is required"),
        noteId: zod_1.z.string().min(1, "Note ID is required"),
    }),
});
