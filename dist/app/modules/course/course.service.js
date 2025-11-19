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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const course_model_1 = require("./course.model");
const courseEnrollment_model_1 = require("./courseEnrollment.model");
class CourseService {
    // ============= ADMIN & INSTRUCTOR OPERATIONS =============
    createCourse(courseData) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield course_model_1.Course.create(courseData);
            return course.populate([
                { path: "mainCategory", select: "name slug" },
                { path: "subCategory", select: "name slug" },
                { path: "instructor", select: "name email profileImage" },
            ]);
        });
    }
    updateCourse(courseId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield course_model_1.Course.findByIdAndUpdate(courseId, { $set: updateData }, { new: true, runValidators: true }).populate([
                { path: "mainCategory", select: "name slug" },
                { path: "subCategory", select: "name slug" },
                { path: "instructor", select: "name email profileImage" },
            ]);
            return course;
        });
    }
    deleteCourse(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield course_model_1.Course.findByIdAndDelete(courseId);
            return !!result;
        });
    }
    getCourseById(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            return course_model_1.Course.findById(courseId).populate([
                { path: "mainCategory", select: "name slug" },
                { path: "subCategory", select: "name slug" },
                { path: "instructor", select: "name email profileImage role" },
            ]);
        });
    }
    getAllCourses(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search, mainCategory, subCategory, instructor, level, status, minPrice, maxPrice, tags, } = options;
            const query = {};
            // Search in title, description, tags
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                    { tags: { $regex: search, $options: "i" } },
                ];
            }
            if (mainCategory)
                query.mainCategory = mainCategory;
            if (subCategory)
                query.subCategory = subCategory;
            if (instructor)
                query.instructor = instructor;
            if (level)
                query.level = level;
            if (status)
                query.status = status;
            // Price range
            if (minPrice !== undefined || maxPrice !== undefined) {
                query.discountedPrice = query.discountedPrice || {};
                if (minPrice !== undefined)
                    query.discountedPrice.$gte = minPrice;
                if (maxPrice !== undefined)
                    query.discountedPrice.$lte = maxPrice;
            }
            // Tags filter
            if (tags && tags.length > 0) {
                query.tags = { $in: tags };
            }
            const skip = (page - 1) * limit;
            const sortOptions = {
                [sortBy]: sortOrder === "asc" ? 1 : -1,
            };
            const [courses, total] = yield Promise.all([
                course_model_1.Course.find(query)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .populate([
                    { path: "mainCategory", select: "name slug" },
                    { path: "subCategory", select: "name slug" },
                    { path: "instructor", select: "name email profileImage" },
                ]),
                course_model_1.Course.countDocuments(query),
            ]);
            return {
                courses,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        });
    }
    getInstructorCourses(instructorId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 10, status } = options;
            const query = {
                instructor: new mongoose_1.Types.ObjectId(instructorId),
            };
            if (status)
                query.status = status;
            const skip = (page - 1) * limit;
            const [courses, total] = yield Promise.all([
                course_model_1.Course.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate([
                    { path: "mainCategory", select: "name slug" },
                    { path: "subCategory", select: "name slug" },
                ]),
                course_model_1.Course.countDocuments(query),
            ]);
            return {
                courses,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        });
    }
    // ============= STUDENT OPERATIONS =============
    enrollInCourse(userId, courseId, purchaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if already enrolled
            const existingEnrollment = yield courseEnrollment_model_1.CourseEnrollment.findOne({
                student: userId,
                course: courseId,
            });
            if (existingEnrollment) {
                throw new Error("Already enrolled in this course");
            }
            // Get course details
            const course = yield course_model_1.Course.findById(courseId);
            if (!course) {
                throw new Error("Course not found");
            }
            // Create enrollment
            const enrollment = yield courseEnrollment_model_1.CourseEnrollment.create({
                student: userId,
                course: courseId,
                purchase: purchaseId,
                enrolledAt: new Date(),
                progress: {
                    completedLessons: [],
                    currentModule: 0,
                    currentLesson: 0,
                    overallProgress: 0,
                    lastAccessedAt: new Date(),
                },
            });
            // Increment enrollment count
            yield course_model_1.Course.findByIdAndUpdate(courseId, {
                $inc: { enrollmentCount: 1 },
            });
            return enrollment.populate([
                { path: "course", select: "title thumbnailImageUrl instructor" },
                { path: "student", select: "name email profileImage" },
            ]);
        });
    }
    getStudentEnrollments(userId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 10, status } = options;
            const query = {
                student: new mongoose_1.Types.ObjectId(userId),
            };
            if (status)
                query.status = status;
            const skip = (page - 1) * limit;
            const [enrollments, total] = yield Promise.all([
                courseEnrollment_model_1.CourseEnrollment.find(query)
                    .sort({ enrolledAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate([
                    {
                        path: "course",
                        select: "title description thumbnailImageUrl level totalDurationMinutes modules",
                        populate: {
                            path: "instructor",
                            select: "name profileImage",
                        },
                    },
                ]),
                courseEnrollment_model_1.CourseEnrollment.countDocuments(query),
            ]);
            return {
                enrollments,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        });
    }
    updateLessonProgress(enrollmentId, userId, lessonData) {
        return __awaiter(this, void 0, void 0, function* () {
            const enrollment = yield courseEnrollment_model_1.CourseEnrollment.findOne({
                _id: enrollmentId,
                student: userId,
            }).populate("course");
            if (!enrollment) {
                throw new Error("Enrollment not found");
            }
            const lessonKey = `${lessonData.moduleIndex}-${lessonData.lessonIndex}`;
            // Update completed lessons
            if (lessonData.completed &&
                !enrollment.progress.completedLessons.includes(lessonKey)) {
                enrollment.progress.completedLessons.push(lessonKey);
            }
            // Update current position
            enrollment.progress.currentModule = lessonData.moduleIndex;
            enrollment.progress.currentLesson = lessonData.lessonIndex;
            enrollment.progress.lastAccessedAt = new Date();
            // Calculate overall progress
            const course = enrollment.course;
            const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
            enrollment.progress.overallProgress =
                (enrollment.progress.completedLessons.length / totalLessons) * 100;
            // Check if course is completed
            if (enrollment.progress.overallProgress >= 100) {
                enrollment.status = "completed";
                enrollment.completedAt = new Date();
            }
            yield enrollment.save();
            return enrollment;
        });
    }
    addNote(enrollmentId, userId, noteData) {
        return __awaiter(this, void 0, void 0, function* () {
            const enrollment = yield courseEnrollment_model_1.CourseEnrollment.findOne({
                _id: enrollmentId,
                student: userId,
            });
            if (!enrollment) {
                throw new Error("Enrollment not found");
            }
            enrollment.notes.push({
                moduleIndex: noteData.moduleIndex,
                lessonIndex: noteData.lessonIndex,
                timestamp: noteData.timestamp,
                content: noteData.content,
                createdAt: new Date(),
            });
            yield enrollment.save();
            return enrollment;
        });
    }
    updateNote(enrollmentId, userId, noteId, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const enrollment = yield courseEnrollment_model_1.CourseEnrollment.findOne({
                _id: enrollmentId,
                student: userId,
            });
            if (!enrollment) {
                throw new Error("Enrollment not found");
            }
            const note = enrollment.notes.find((n) => { var _a; return ((_a = n._id) === null || _a === void 0 ? void 0 : _a.toString()) === noteId; });
            if (!note) {
                throw new Error("Note not found");
            }
            note.content = content;
            yield enrollment.save();
            return enrollment;
        });
    }
    deleteNote(enrollmentId, userId, noteId) {
        return __awaiter(this, void 0, void 0, function* () {
            const enrollment = yield courseEnrollment_model_1.CourseEnrollment.findOne({
                _id: enrollmentId,
                student: userId,
            });
            if (!enrollment) {
                throw new Error("Enrollment not found");
            }
            enrollment.notes = enrollment.notes.filter((n) => { var _a; return ((_a = n._id) === null || _a === void 0 ? void 0 : _a.toString()) !== noteId; });
            yield enrollment.save();
            return enrollment;
        });
    }
    checkEnrollment(userId, courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            return courseEnrollment_model_1.CourseEnrollment.findOne({
                student: userId,
                course: courseId,
            }).populate("course");
        });
    }
    // ============= ANALYTICS =============
    getCourseAnalytics(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [enrollments, course] = yield Promise.all([
                courseEnrollment_model_1.CourseEnrollment.find({ course: courseId }),
                course_model_1.Course.findById(courseId),
            ]);
            if (!course) {
                throw new Error("Course not found");
            }
            const activeEnrollments = enrollments.filter((e) => e.status === "active").length;
            const completedEnrollments = enrollments.filter((e) => e.status === "completed").length;
            const averageProgress = enrollments.reduce((sum, e) => sum + e.progress.overallProgress, 0) / enrollments.length || 0;
            // Calculate revenue (assuming course price)
            const totalRevenue = enrollments.length * (course.discountedPrice || course.basePrice);
            // Enrollment trend (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentEnrollments = enrollments.filter((e) => e.enrolledAt && e.enrolledAt >= thirtyDaysAgo);
            const enrollmentTrend = [];
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split("T")[0];
                const count = recentEnrollments.filter((e) => {
                    var _a;
                    const enrollDate = (_a = e.enrolledAt) === null || _a === void 0 ? void 0 : _a.toISOString().split("T")[0];
                    return enrollDate === dateStr;
                }).length;
                enrollmentTrend.push({ date: dateStr, count });
            }
            return {
                totalEnrollments: enrollments.length,
                activeEnrollments,
                completedEnrollments,
                averageProgress,
                totalRevenue,
                enrollmentTrend,
            };
        });
    }
    getInstructorAnalytics(instructorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const courses = yield course_model_1.Course.find({ instructor: instructorId });
            const courseIds = courses.map((c) => c._id);
            const enrollments = yield courseEnrollment_model_1.CourseEnrollment.find({
                course: { $in: courseIds },
            }).populate("course");
            const totalRevenue = courses.reduce((sum, course) => {
                const courseEnrollments = enrollments.filter((e) => {
                    var _a, _b;
                    return ((_a = e.course._id) === null || _a === void 0 ? void 0 : _a.toString()) ===
                        ((_b = course._id) === null || _b === void 0 ? void 0 : _b.toString());
                }).length;
                return (sum + courseEnrollments * (course.discountedPrice || course.basePrice));
            }, 0);
            const averageRating = courses.reduce((sum, c) => sum + c.averageRating, 0) /
                courses.length || 0;
            // Top 5 courses by enrollment
            const topCourses = courses
                .map((course) => {
                const courseEnrollments = enrollments.filter((e) => {
                    var _a, _b;
                    return ((_a = e.course._id) === null || _a === void 0 ? void 0 : _a.toString()) ===
                        ((_b = course._id) === null || _b === void 0 ? void 0 : _b.toString());
                }).length;
                return {
                    course,
                    enrollmentCount: courseEnrollments,
                    revenue: courseEnrollments * (course.discountedPrice || course.basePrice),
                };
            })
                .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
                .slice(0, 5);
            return {
                totalCourses: courses.length,
                totalEnrollments: enrollments.length,
                totalRevenue,
                averageRating,
                topCourses,
            };
        });
    }
    // ============= FEATURED & RECOMMENDATIONS =============
    getFeaturedCourses() {
        return __awaiter(this, arguments, void 0, function* (limit = 6) {
            return course_model_1.Course.find({ status: "Active" })
                .sort({ enrollmentCount: -1, averageRating: -1 })
                .limit(limit)
                .populate([
                { path: "mainCategory", select: "name slug" },
                { path: "subCategory", select: "name slug" },
                { path: "instructor", select: "name profileImage" },
            ]);
        });
    }
    getRecommendedCourses(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 6) {
            // Get user's enrollments
            const enrollments = yield courseEnrollment_model_1.CourseEnrollment.find({
                student: userId,
            }).populate("course");
            const enrolledCourseIds = enrollments.map((e) => { var _a; return (_a = e.course._id) === null || _a === void 0 ? void 0 : _a.toString(); });
            // Get categories from enrolled courses
            const enrolledCategories = enrollments
                .map((e) => { var _a; return (_a = e.course.mainCategory) === null || _a === void 0 ? void 0 : _a.toString(); })
                .filter((c) => !!c);
            // Find courses in similar categories that user hasn't enrolled in
            const recommendations = yield course_model_1.Course.find({
                _id: { $nin: enrolledCourseIds },
                mainCategory: { $in: enrolledCategories },
                status: "Active",
            })
                .sort({ enrollmentCount: -1, averageRating: -1 })
                .limit(limit)
                .populate([
                { path: "mainCategory", select: "name slug" },
                { path: "subCategory", select: "name slug" },
                { path: "instructor", select: "name profileImage" },
            ]);
            return recommendations;
        });
    }
    getCoursesByCategory(categoryId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 10 } = options;
            const query = {
                $or: [{ mainCategory: categoryId }, { subCategory: categoryId }],
                status: "Active",
            };
            const skip = (page - 1) * limit;
            const [courses, total] = yield Promise.all([
                course_model_1.Course.find(query)
                    .sort({ enrollmentCount: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate([
                    { path: "mainCategory", select: "name slug" },
                    { path: "subCategory", select: "name slug" },
                    { path: "instructor", select: "name profileImage" },
                ]),
                course_model_1.Course.countDocuments(query),
            ]);
            return {
                courses,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        });
    }
}
exports.default = new CourseService();
