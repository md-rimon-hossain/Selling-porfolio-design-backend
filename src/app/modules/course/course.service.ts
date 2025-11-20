import { Types } from "mongoose";
import { Course } from "./course.model";

import type { ICourse } from "./course.interface";

import { CourseEnrollment } from "./courseEnrollment.model";
import { ICourseEnrollment } from "./courseEnrollment.interface";

interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  mainCategory?: string;
  subCategory?: string;
  instructor?: string;
  level?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
}

class CourseService {
  // ============= ADMIN & INSTRUCTOR OPERATIONS =============

  async createCourse(courseData: Partial<ICourse>): Promise<ICourse> {
    const course = await Course.create(courseData);
    return course.populate([
      { path: "mainCategory", select: "name slug" },
      { path: "subCategory", select: "name slug" },
      { path: "instructor", select: "name email profileImage" },
    ]);
  }

  async updateCourse(
    courseId: string,
    updateData: Partial<ICourse>,
  ): Promise<ICourse | null> {
    const course = await Course.findByIdAndUpdate(
      courseId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate([
      { path: "mainCategory", select: "name slug" },
      { path: "subCategory", select: "name slug" },
      { path: "instructor", select: "name email profileImage" },
    ]);

    return course;
  }

  async deleteCourse(courseId: string): Promise<boolean> {
    const result = await Course.findByIdAndDelete(courseId);
    return !!result;
  }

  async getCourseById(courseId: string): Promise<ICourse | null> {
    return Course.findById(courseId).populate([
      { path: "mainCategory", select: "name slug" },
      { path: "subCategory", select: "name slug" },
      { path: "instructor", select: "name email profileImage role" },
    ]);
  }

  async getAllCourses(options: QueryOptions): Promise<{
    courses: ICourse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
      mainCategory,
      subCategory,
      instructor,
      level,
      status,
      minPrice,
      maxPrice,
      tags,
    } = options;

    const query: Record<string, unknown> = {};

    // Search in title, description, tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (mainCategory) query.mainCategory = mainCategory;
    if (subCategory) query.subCategory = subCategory;
    if (instructor) query.instructor = instructor;
    if (level) query.level = level;
    if (status) query.status = status;

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.discountedPrice = query.discountedPrice || {};
      if (minPrice !== undefined)
        (query.discountedPrice as Record<string, number>).$gte = minPrice;
      if (maxPrice !== undefined)
        (query.discountedPrice as Record<string, number>).$lte = maxPrice;
    }

    // Tags filter
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate([
          { path: "mainCategory", select: "name slug" },
          { path: "subCategory", select: "name slug" },
          { path: "instructor", select: "name email profileImage" },
        ]),
      Course.countDocuments(query),
    ]);

    return {
      courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInstructorCourses(
    instructorId: string,
    options: QueryOptions,
  ): Promise<{
    courses: ICourse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status } = options;

    const query: Record<string, unknown> = {
      instructor: new Types.ObjectId(instructorId),
    };

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate([
          { path: "mainCategory", select: "name slug" },
          { path: "subCategory", select: "name slug" },
        ]),
      Course.countDocuments(query),
    ]);

    return {
      courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============= STUDENT OPERATIONS =============

  async enrollInCourse(
    userId: string,
    courseId: string,
    purchaseId?: string,
  ): Promise<ICourseEnrollment> {
    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      throw new Error("Already enrolled in this course");
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Create enrollment
    const enrollment = await CourseEnrollment.create({
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
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 },
    });

    return enrollment.populate([
      { path: "course", select: "title thumbnailImageUrl instructor" },
      { path: "student", select: "name email profileImage" },
    ]);
  }

  async getStudentEnrollments(
    userId: string,
    options: { page?: number; limit?: number; status?: string },
  ): Promise<{
    enrollments: ICourseEnrollment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status } = options;

    const query: Record<string, unknown> = {
      student: new Types.ObjectId(userId),
    };

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      CourseEnrollment.find(query)
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate([
          {
            path: "course",
            select:
              "title description thumbnailImageUrl level totalDurationMinutes modules",
            populate: {
              path: "instructor",
              select: "name profileImage",
            },
          },
        ]),
      CourseEnrollment.countDocuments(query),
    ]);

    return {
      enrollments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateLessonProgress(
    enrollmentId: string,
    userId: string,
    lessonData: {
      moduleIndex: number;
      lessonIndex: number;
      completed: boolean;
      watchedDuration?: number;
    },
  ): Promise<ICourseEnrollment | null> {
    const enrollment = await CourseEnrollment.findOne({
      _id: enrollmentId,
      student: userId,
    }).populate("course");

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    const lessonKey = `${lessonData.moduleIndex}-${lessonData.lessonIndex}`;

    // Update completed lessons
    if (
      lessonData.completed &&
      !enrollment.progress.completedLessons.includes(lessonKey)
    ) {
      enrollment.progress.completedLessons.push(lessonKey);
    }

    // Update current position
    enrollment.progress.currentModule = lessonData.moduleIndex;
    enrollment.progress.currentLesson = lessonData.lessonIndex;
    enrollment.progress.lastAccessedAt = new Date();

    // Calculate overall progress
    const course = enrollment.course as unknown as ICourse;
    const totalLessons = course.modules.reduce(
      (sum, module) => sum + module.lessons.length,
      0,
    );
    enrollment.progress.overallProgress =
      (enrollment.progress.completedLessons.length / totalLessons) * 100;

    // Check if course is completed
    if (enrollment.progress.overallProgress >= 100) {
      enrollment.status = "completed";
      enrollment.completedAt = new Date();
    }

    await enrollment.save();
    return enrollment;
  }

  async addNote(
    enrollmentId: string,
    userId: string,
    noteData: {
      moduleIndex: number;
      lessonIndex: number;
      timestamp: number;
      content: string;
    },
  ): Promise<ICourseEnrollment | null> {
    const enrollment = await CourseEnrollment.findOne({
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

    await enrollment.save();
    return enrollment;
  }

  async updateNote(
    enrollmentId: string,
    userId: string,
    noteId: string,
    content: string,
  ): Promise<ICourseEnrollment | null> {
    const enrollment = await CourseEnrollment.findOne({
      _id: enrollmentId,
      student: userId,
    });

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    const note = enrollment.notes.find(
      (n: { _id?: { toString: () => string } }) => n._id?.toString() === noteId,
    );
    if (!note) {
      throw new Error("Note not found");
    }

    note.content = content;
    await enrollment.save();
    return enrollment;
  }

  async deleteNote(
    enrollmentId: string,
    userId: string,
    noteId: string,
  ): Promise<ICourseEnrollment | null> {
    const enrollment = await CourseEnrollment.findOne({
      _id: enrollmentId,
      student: userId,
    });

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    enrollment.notes = enrollment.notes.filter(
      (n: { _id?: { toString: () => string } }) => n._id?.toString() !== noteId,
    );

    await enrollment.save();
    return enrollment;
  }

  async checkEnrollment(
    userId: string,
    courseId: string,
  ): Promise<ICourseEnrollment | null> {
    return CourseEnrollment.findOne({
      student: userId,
      course: courseId,
    }).populate("course");
  }

  // ============= ANALYTICS =============

  async getCourseAnalytics(courseId: string): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    averageProgress: number;
    totalRevenue: number;
    enrollmentTrend: Array<{ date: string; count: number }>;
  }> {
    const [enrollments, course] = await Promise.all([
      CourseEnrollment.find({ course: courseId }),
      Course.findById(courseId),
    ]);

    if (!course) {
      throw new Error("Course not found");
    }

    const activeEnrollments = enrollments.filter(
      (e: ICourseEnrollment) => e.status === "active",
    ).length;
    const completedEnrollments = enrollments.filter(
      (e: ICourseEnrollment) => e.status === "completed",
    ).length;

    const averageProgress =
      enrollments.reduce(
        (sum: number, e: ICourseEnrollment) => sum + e.progress.overallProgress,
        0,
      ) / enrollments.length || 0;

    // Calculate revenue (assuming course price)
    const totalRevenue =
      enrollments.length * (course.discountedPrice || course.basePrice);

    // Enrollment trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEnrollments = enrollments.filter(
      (e: ICourseEnrollment) => e.enrolledAt && e.enrolledAt >= thirtyDaysAgo,
    );

    const enrollmentTrend: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const count = recentEnrollments.filter((e: ICourseEnrollment) => {
        const enrollDate = e.enrolledAt?.toISOString().split("T")[0];
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
  }

  async getInstructorAnalytics(instructorId: string): Promise<{
    totalCourses: number;
    totalEnrollments: number;
    totalRevenue: number;
    averageRating: number;
    topCourses: Array<{
      course: ICourse;
      enrollmentCount: number;
      revenue: number;
    }>;
  }> {
    const courses = await Course.find({ instructor: instructorId });

    const courseIds = courses.map((c) => c._id);
    const enrollments = await CourseEnrollment.find({
      course: { $in: courseIds },
    }).populate("course");

    const totalRevenue = courses.reduce((sum: number, course: ICourse) => {
      const courseEnrollments = enrollments.filter(
        (e: ICourseEnrollment) =>
          (e.course as unknown as ICourse)._id?.toString() ===
          course._id?.toString(),
      ).length;
      return (
        sum + courseEnrollments * (course.discountedPrice || course.basePrice)
      );
    }, 0);

    const averageRating =
      courses.reduce((sum: number, c: ICourse) => sum + c.averageRating, 0) /
        courses.length || 0;

    // Top 5 courses by enrollment
    const topCourses = courses
      .map((course: ICourse) => {
        const courseEnrollments = enrollments.filter(
          (e: ICourseEnrollment) =>
            (e.course as unknown as ICourse)._id?.toString() ===
            course._id?.toString(),
        ).length;
        return {
          course,
          enrollmentCount: courseEnrollments,
          revenue:
            courseEnrollments * (course.discountedPrice || course.basePrice),
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
  }

  // ============= FEATURED & RECOMMENDATIONS =============

  async getFeaturedCourses(limit = 6): Promise<ICourse[]> {
    return Course.find({ status: "Active" })
      .sort({ enrollmentCount: -1, averageRating: -1 })
      .limit(limit)
      .populate([
        { path: "mainCategory", select: "name slug" },
        { path: "subCategory", select: "name slug" },
        { path: "instructor", select: "name profileImage" },
      ]);
  }

  async getRecommendedCourses(userId: string, limit = 6): Promise<ICourse[]> {
    // Get user's enrollments
    const enrollments = await CourseEnrollment.find({
      student: userId,
    }).populate("course");

    const enrolledCourseIds = enrollments.map((e: ICourseEnrollment) =>
      (e.course as unknown as ICourse)._id?.toString(),
    );

    // Get categories from enrolled courses
    const enrolledCategories = enrollments
      .map((e: ICourseEnrollment) =>
        (e.course as unknown as ICourse).mainCategory?.toString(),
      )
      .filter((c: string | undefined): c is string => !!c);

    // Find courses in similar categories that user hasn't enrolled in
    const recommendations = await Course.find({
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
  }

  async getCoursesByCategory(
    categoryId: string,
    options: QueryOptions,
  ): Promise<{
    courses: ICourse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = options;

    const query: Record<string, unknown> = {
      $or: [{ mainCategory: categoryId }, { subCategory: categoryId }],
      status: "Active",
    };

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort({ enrollmentCount: -1 })
        .skip(skip)
        .limit(limit)
        .populate([
          { path: "mainCategory", select: "name slug" },
          { path: "subCategory", select: "name slug" },
          { path: "instructor", select: "name profileImage" },
        ]),
      Course.countDocuments(query),
    ]);

    return {
      courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default new CourseService();
