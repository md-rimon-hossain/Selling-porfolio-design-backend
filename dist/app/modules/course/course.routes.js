"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseRoutes = void 0;
const express_1 = require("express");
const course_controller_1 = __importDefault(require("./course.controller"));
const auth_1 = require("../../middlewares/auth");
const validateZodSchemas_1 = require("../../middlewares/validateZodSchemas");
const course_validation_1 = require("./course.validation");
const router = (0, express_1.Router)();
// ============= PUBLIC ROUTES =============
router.get("/", (0, validateZodSchemas_1.validateRequest)(course_validation_1.courseQuerySchema), course_controller_1.default.getAllCourses);
router.get("/featured", course_controller_1.default.getFeaturedCourses);
router.get("/category/:categoryId", course_controller_1.default.getCoursesByCategory);
router.get("/:id", (0, validateZodSchemas_1.validateRequest)(course_validation_1.courseIdParamSchema), course_controller_1.default.getCourseById);
// ============= AUTHENTICATED ROUTES =============
// Check enrollment status
router.get("/:id/enrollment/check", auth_1.authenticate, (0, validateZodSchemas_1.validateRequest)(course_validation_1.courseIdParamSchema), course_controller_1.default.checkEnrollment);
// Get recommended courses for logged-in user
router.get("/recommendations/for-me", auth_1.authenticate, course_controller_1.default.getRecommendedCourses);
// ============= STUDENT ROUTES =============
// Enroll in a course
router.post("/enroll", auth_1.authenticate, (0, auth_1.authorize)("customer", "designer"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.enrollInCourseSchema), course_controller_1.default.enrollInCourse);
// Get my enrollments
router.get("/my/enrollments", auth_1.authenticate, (0, auth_1.authorize)("customer", "designer"), course_controller_1.default.getMyEnrollments);
// Update lesson progress
router.patch("/enrollments/:enrollmentId/progress", auth_1.authenticate, (0, auth_1.authorize)("customer", "designer"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.enrollmentIdParamSchema), (0, validateZodSchemas_1.validateRequest)(course_validation_1.updateProgressSchema), course_controller_1.default.updateLessonProgress);
// Note management
router.post("/enrollments/:enrollmentId/notes", auth_1.authenticate, (0, auth_1.authorize)("customer", "designer"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.enrollmentIdParamSchema), (0, validateZodSchemas_1.validateRequest)(course_validation_1.addNoteSchema), course_controller_1.default.addNote);
router.patch("/enrollments/:enrollmentId/notes/:noteId", auth_1.authenticate, (0, auth_1.authorize)("customer", "designer"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.noteIdParamSchema), (0, validateZodSchemas_1.validateRequest)(course_validation_1.updateNoteSchema), course_controller_1.default.updateNote);
router.delete("/enrollments/:enrollmentId/notes/:noteId", auth_1.authenticate, (0, auth_1.authorize)("customer", "designer"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.noteIdParamSchema), course_controller_1.default.deleteNote);
// ============= INSTRUCTOR ROUTES =============
// Get instructor's own courses
router.get("/instructor/my-courses", auth_1.authenticate, (0, auth_1.authorize)("instructor"), course_controller_1.default.getInstructorCourses);
// Get instructor analytics
router.get("/instructor/analytics", auth_1.authenticate, (0, auth_1.authorize)("instructor"), course_controller_1.default.getInstructorAnalytics);
// Create course (instructor or admin)
router.post("/instructor/create", auth_1.authenticate, (0, auth_1.authorize)("instructor", "admin", "super_admin"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.createCourseSchema), course_controller_1.default.createCourse);
// Update course (instructor or admin)
router.patch("/instructor/:id", auth_1.authenticate, (0, auth_1.authorize)("instructor", "admin", "super_admin"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.courseIdParamSchema), (0, validateZodSchemas_1.validateRequest)(course_validation_1.updateCourseSchema), course_controller_1.default.updateCourse);
// Delete course (instructor or admin)
router.delete("/instructor/:id", auth_1.authenticate, (0, auth_1.authorize)("instructor", "admin", "super_admin"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.courseIdParamSchema), course_controller_1.default.deleteCourse);
// ============= ADMIN ROUTES =============
// Get course analytics (admin only)
router.get("/admin/:id/analytics", auth_1.authenticate, (0, auth_1.authorize)("admin", "super_admin"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.courseIdParamSchema), course_controller_1.default.getCourseAnalytics);
// Admin can create courses for any instructor
router.post("/admin/create", auth_1.authenticate, (0, auth_1.authorize)("admin", "super_admin"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.createCourseSchema), course_controller_1.default.createCourse);
// Admin can update any course
router.patch("/admin/:id", auth_1.authenticate, (0, auth_1.authorize)("admin", "super_admin"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.courseIdParamSchema), (0, validateZodSchemas_1.validateRequest)(course_validation_1.updateCourseSchema), course_controller_1.default.updateCourse);
// Admin can delete any course
router.delete("/admin/:id", auth_1.authenticate, (0, auth_1.authorize)("admin", "super_admin"), (0, validateZodSchemas_1.validateRequest)(course_validation_1.courseIdParamSchema), course_controller_1.default.deleteCourse);
exports.courseRoutes = router;
