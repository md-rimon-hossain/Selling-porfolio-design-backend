"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const course_service_1 = __importDefault(require("./course.service"));
class CourseController {
    // ============= ADMIN & INSTRUCTOR: COURSE CRUD =============
    createCourse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const courseData = req.body;
                // If instructor is not provided, use the logged-in user
                if (!courseData.instructor && req.user) {
                    courseData.instructor = req.user._id;
                }
                const course = yield course_service_1.default.createCourse(courseData);
                res.status(201).json({
                    success: true,
                    message: "Course created successfully",
                    data: course,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to create course",
                });
            }
        });
    }
    updateCourse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { id } = req.params;
                const updateData = req.body;
                // Check if user is instructor or admin
                if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "instructor") {
                    const course = yield course_service_1.default.getCourseById(id);
                    if (course &&
                        course.instructor.toString() !== ((_b = req.user._id) === null || _b === void 0 ? void 0 : _b.toString())) {
                        res.status(403).json({
                            success: false,
                            message: "You can only update your own courses",
                        });
                        return;
                    }
                }
                const course = yield course_service_1.default.updateCourse(id, updateData);
                if (!course) {
                    res.status(404).json({
                        success: false,
                        message: "Course not found",
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: "Course updated successfully",
                    data: course,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to update course",
                });
            }
        });
    }
    deleteCourse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { id } = req.params;
                // Check if user is instructor or admin
                if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "instructor") {
                    const course = yield course_service_1.default.getCourseById(id);
                    if (course &&
                        course.instructor.toString() !== ((_b = req.user._id) === null || _b === void 0 ? void 0 : _b.toString())) {
                        res.status(403).json({
                            success: false,
                            message: "You can only delete your own courses",
                        });
                        return;
                    }
                }
                const deleted = yield course_service_1.default.deleteCourse(id);
                if (!deleted) {
                    res.status(404).json({
                        success: false,
                        message: "Course not found",
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: "Course deleted successfully",
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to delete course",
                });
            }
        });
    }
    getCourseById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const course = yield course_service_1.default.getCourseById(id);
                if (!course) {
                    res.status(404).json({
                        success: false,
                        message: "Course not found",
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    data: course,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch course",
                });
            }
        });
    }
    getAllCourses(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const options = req.query;
                const result = yield course_service_1.default.getAllCourses(options);
                res.status(200).json({
                    success: true,
                    data: result.courses,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.total,
                        totalPages: result.totalPages,
                    },
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch courses",
                });
            }
        });
    }
    getInstructorCourses(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const instructorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!instructorId) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                    return;
                }
                const options = req.query;
                const result = yield course_service_1.default.getInstructorCourses(instructorId.toString(), options);
                res.status(200).json({
                    success: true,
                    data: result.courses,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.total,
                        totalPages: result.totalPages,
                    },
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error
                        ? error.message
                        : "Failed to fetch instructor courses",
                });
            }
        });
    }
    // ============= STUDENT: ENROLLMENT & LEARNING =============
    enrollInCourse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const { courseId, purchaseId } = req.body;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                    return;
                }
                const enrollment = yield course_service_1.default.enrollInCourse(userId.toString(), courseId, purchaseId);
                res.status(201).json({
                    success: true,
                    message: "Successfully enrolled in course",
                    data: enrollment,
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to enroll in course",
                });
            }
        });
    }
    getMyEnrollments(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                    return;
                }
                const options = req.query;
                const result = yield course_service_1.default.getStudentEnrollments(userId.toString(), options);
                res.status(200).json({
                    success: true,
                    data: result.enrollments,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.total,
                        totalPages: result.totalPages,
                    },
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error
                        ? error.message
                        : "Failed to fetch enrollments",
                });
            }
        });
    }
    updateLessonProgress(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const { enrollmentId } = req.params;
                const lessonData = req.body;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                    return;
                }
                const enrollment = yield course_service_1.default.updateLessonProgress(enrollmentId, userId.toString(), lessonData);
                res.status(200).json({
                    success: true,
                    message: "Progress updated successfully",
                    data: enrollment,
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to update progress",
                });
            }
        });
    }
    addNote(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const { enrollmentId } = req.params;
                const noteData = req.body;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                    return;
                }
                const enrollment = yield course_service_1.default.addNote(enrollmentId, userId.toString(), noteData);
                res.status(201).json({
                    success: true,
                    message: "Note added successfully",
                    data: enrollment,
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to add note",
                });
            }
        });
    }
    updateNote(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const { enrollmentId, noteId } = req.params;
                const { content } = req.body;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                    return;
                }
                const enrollment = yield course_service_1.default.updateNote(enrollmentId, userId.toString(), noteId, content);
                res.status(200).json({
                    success: true,
                    message: "Note updated successfully",
                    data: enrollment,
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to update note",
                });
            }
        });
    }
    deleteNote(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const { enrollmentId, noteId } = req.params;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                    return;
                }
                const enrollment = yield course_service_1.default.deleteNote(enrollmentId, userId.toString(), noteId);
                res.status(200).json({
                    success: true,
                    message: "Note deleted successfully",
                    data: enrollment,
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to delete note",
                });
            }
        });
    }
    checkEnrollment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const { id: courseId } = req.params;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                    return;
                }
                const enrollment = yield course_service_1.default.checkEnrollment(userId.toString(), courseId);
                res.status(200).json({
                    success: true,
                    data: {
                        isEnrolled: !!enrollment,
                        enrollment: enrollment || null,
                    },
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to check enrollment",
                });
            }
        });
    }
    // ============= ANALYTICS =============
    getCourseAnalytics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const analytics = yield course_service_1.default.getCourseAnalytics(id);
                res.status(200).json({
                    success: true,
                    data: analytics,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error
                        ? error.message
                        : "Failed to fetch course analytics",
                });
            }
        });
    }
    getInstructorAnalytics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const instructorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!instructorId) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                    return;
                }
                const analytics = yield course_service_1.default.getInstructorAnalytics(instructorId.toString());
                res.status(200).json({
                    success: true,
                    data: analytics,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error
                        ? error.message
                        : "Failed to fetch instructor analytics",
                });
            }
        });
    }
    // ============= FEATURED & RECOMMENDATIONS =============
    getFeaturedCourses(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = req.query.limit
                    ? parseInt(req.query.limit)
                    : undefined;
                const courses = yield course_service_1.default.getFeaturedCourses(limit);
                res.status(200).json({
                    success: true,
                    data: courses,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error
                        ? error.message
                        : "Failed to fetch featured courses",
                });
            }
        });
    }
    getRecommendedCourses(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    // Return featured courses if not logged in
                    const courses = yield course_service_1.default.getFeaturedCourses();
                    res.status(200).json({
                        success: true,
                        data: courses,
                    });
                    return;
                }
                const limit = req.query.limit
                    ? parseInt(req.query.limit)
                    : undefined;
                const courses = yield course_service_1.default.getRecommendedCourses(userId.toString(), limit);
                res.status(200).json({
                    success: true,
                    data: courses,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error
                        ? error.message
                        : "Failed to fetch recommended courses",
                });
            }
        });
    }
    getCoursesByCategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { categoryId } = req.params;
                const options = req.query;
                const result = yield course_service_1.default.getCoursesByCategory(categoryId, options);
                res.status(200).json({
                    success: true,
                    data: result.courses,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.total,
                        totalPages: result.totalPages,
                    },
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error
                        ? error.message
                        : "Failed to fetch courses by category",
                });
            }
        });
    }
}
exports.default = new CourseController();
