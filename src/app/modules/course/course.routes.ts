import { Router } from "express";
import courseController from "./course.controller";
import { authenticate, authorize } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateZodSchemas";
import {
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema,
  courseIdParamSchema,
  enrollInCourseSchema,
  updateProgressSchema,
  addNoteSchema,
  updateNoteSchema,
  enrollmentIdParamSchema,
  noteIdParamSchema,
} from "./course.validation";

const router = Router();

// ============= PUBLIC ROUTES =============
router.get(
  "/",
  validateRequest(courseQuerySchema),
  courseController.getAllCourses,
);

router.get("/featured", courseController.getFeaturedCourses);

router.get("/category/:categoryId", courseController.getCoursesByCategory);

router.get(
  "/:id",
  validateRequest(courseIdParamSchema),
  courseController.getCourseById,
);

// ============= AUTHENTICATED ROUTES =============

// Check enrollment status
router.get(
  "/:id/enrollment/check",
  authenticate,
  validateRequest(courseIdParamSchema),
  courseController.checkEnrollment,
);

// Get recommended courses for logged-in user
router.get(
  "/recommendations/for-me",
  authenticate,
  courseController.getRecommendedCourses,
);

// ============= STUDENT ROUTES =============

// Enroll in a course
router.post(
  "/enroll",
  authenticate,
  authorize("customer", "designer"),
  validateRequest(enrollInCourseSchema),
  courseController.enrollInCourse,
);

// Get my enrollments
router.get(
  "/my/enrollments",
  authenticate,
  authorize("customer", "designer"),
  courseController.getMyEnrollments,
);

// Update lesson progress
router.patch(
  "/enrollments/:enrollmentId/progress",
  authenticate,
  authorize("customer", "designer"),
  validateRequest(enrollmentIdParamSchema),
  validateRequest(updateProgressSchema),
  courseController.updateLessonProgress,
);

// Note management
router.post(
  "/enrollments/:enrollmentId/notes",
  authenticate,
  authorize("customer", "designer"),
  validateRequest(enrollmentIdParamSchema),
  validateRequest(addNoteSchema),
  courseController.addNote,
);

router.patch(
  "/enrollments/:enrollmentId/notes/:noteId",
  authenticate,
  authorize("customer", "designer"),
  validateRequest(noteIdParamSchema),
  validateRequest(updateNoteSchema),
  courseController.updateNote,
);

router.delete(
  "/enrollments/:enrollmentId/notes/:noteId",
  authenticate,
  authorize("customer", "designer"),
  validateRequest(noteIdParamSchema),
  courseController.deleteNote,
);

// ============= INSTRUCTOR ROUTES =============

// Get instructor's own courses
router.get(
  "/instructor/my-courses",
  authenticate,
  authorize("instructor", "admin", "super_admin"),
  courseController.getInstructorCourses,
);

// Get instructor analytics
router.get(
  "/instructor/analytics",
  authenticate,
  authorize("instructor", "admin", "super_admin"),
  courseController.getInstructorAnalytics,
);

// Create course (instructor or admin)
router.post(
  "/instructor/create",
  authenticate,
  authorize("instructor", "admin", "super_admin"),
  validateRequest(createCourseSchema),
  courseController.createCourse,
);

// Update course (instructor or admin)
router.patch(
  "/instructor/:id",
  authenticate,
  authorize("instructor", "admin", "super_admin"),
  validateRequest(courseIdParamSchema),
  validateRequest(updateCourseSchema),
  courseController.updateCourse,
);

// Delete course (instructor or admin)
router.delete(
  "/instructor/:id",
  authenticate,
  authorize("instructor", "admin", "super_admin"),
  validateRequest(courseIdParamSchema),
  courseController.deleteCourse,
);

// ============= ADMIN ROUTES =============

// Get course analytics (admin only)
router.get(
  "/admin/:id/analytics",
  authenticate,
  authorize("admin", "super_admin"),
  validateRequest(courseIdParamSchema),
  courseController.getCourseAnalytics,
);

// Admin can create courses for any instructor
router.post(
  "/admin/create",
  authenticate,
  authorize("admin", "super_admin"),
  validateRequest(createCourseSchema),
  courseController.createCourse,
);

// Admin can update any course
router.patch(
  "/admin/:id",
  authenticate,
  authorize("admin", "super_admin"),
  validateRequest(courseIdParamSchema),
  validateRequest(updateCourseSchema),
  courseController.updateCourse,
);

// Admin can delete any course
router.delete(
  "/admin/:id",
  authenticate,
  authorize("admin", "super_admin"),
  validateRequest(courseIdParamSchema),
  courseController.deleteCourse,
);

export const courseRoutes = router;
