import type { Request, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth";
import courseService from "./course.service";

class CourseController {
  // ============= ADMIN & INSTRUCTOR: COURSE CRUD =============

  async createCourse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const courseData = req.body;

      // If instructor is not provided, use the logged-in user
      if (!courseData.instructor && req.user) {
        courseData.instructor = req.user._id;
      }

      const course = await courseService.createCourse(courseData);

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        data: course,
      });
    } catch (error) {
      console.error("Course creation error:", error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create course",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updateCourse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if user is instructor or admin
      if (req.user?.role === "instructor") {
        const course = await courseService.getCourseById(id);
        if (
          course &&
          course.instructor.toString() !== req.user._id?.toString()
        ) {
          res.status(403).json({
            success: false,
            message: "You can only update your own courses",
          });
          return;
        }
      }

      const course = await courseService.updateCourse(id, updateData);

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
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update course",
      });
    }
  }

  async deleteCourse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user is instructor or admin
      if (req.user?.role === "instructor") {
        const course = await courseService.getCourseById(id);
        if (
          course &&
          course.instructor.toString() !== req.user._id?.toString()
        ) {
          res.status(403).json({
            success: false,
            message: "You can only delete your own courses",
          });
          return;
        }
      }

      const deleted = await courseService.deleteCourse(id);

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
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete course",
      });
    }
  }

  async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const course = await courseService.getCourseById(id);

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
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch course",
      });
    }
  }

  async getAllCourses(req: Request, res: Response): Promise<void> {
    try {
      const options = req.query;
      const result = await courseService.getAllCourses(options);

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
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch courses",
      });
    }
  }

  async getInstructorCourses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?._id;

      if (!instructorId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const options = req.query;
      const result = await courseService.getInstructorCourses(
        instructorId.toString(),
        options,
      );

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
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch instructor courses",
      });
    }
  }

  // ============= STUDENT: ENROLLMENT & LEARNING =============

  async enrollInCourse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { courseId, purchaseId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const enrollment = await courseService.enrollInCourse(
        userId.toString(),
        courseId,
        purchaseId,
      );

      res.status(201).json({
        success: true,
        message: "Successfully enrolled in course",
        data: enrollment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to enroll in course",
      });
    }
  }

  async getMyEnrollments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const options = req.query;
      const result = await courseService.getStudentEnrollments(
        userId.toString(),
        options,
      );

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
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch enrollments",
      });
    }
  }

  async updateLessonProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { enrollmentId } = req.params;
      const lessonData = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const enrollment = await courseService.updateLessonProgress(
        enrollmentId,
        userId.toString(),
        lessonData,
      );

      res.status(200).json({
        success: true,
        message: "Progress updated successfully",
        data: enrollment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update progress",
      });
    }
  }

  async addNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { enrollmentId } = req.params;
      const noteData = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const enrollment = await courseService.addNote(
        enrollmentId,
        userId.toString(),
        noteData,
      );

      res.status(201).json({
        success: true,
        message: "Note added successfully",
        data: enrollment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to add note",
      });
    }
  }

  async updateNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { enrollmentId, noteId } = req.params;
      const { content } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const enrollment = await courseService.updateNote(
        enrollmentId,
        userId.toString(),
        noteId,
        content,
      );

      res.status(200).json({
        success: true,
        message: "Note updated successfully",
        data: enrollment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update note",
      });
    }
  }

  async deleteNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { enrollmentId, noteId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const enrollment = await courseService.deleteNote(
        enrollmentId,
        userId.toString(),
        noteId,
      );

      res.status(200).json({
        success: true,
        message: "Note deleted successfully",
        data: enrollment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete note",
      });
    }
  }

  async checkEnrollment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { id: courseId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const enrollment = await courseService.checkEnrollment(
        userId.toString(),
        courseId,
      );

      res.status(200).json({
        success: true,
        data: {
          isEnrolled: !!enrollment,
          enrollment: enrollment || null,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to check enrollment",
      });
    }
  }

  // ============= ANALYTICS =============

  async getCourseAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const analytics = await courseService.getCourseAnalytics(id);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch course analytics",
      });
    }
  }

  async getInstructorAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?._id;

      if (!instructorId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const analytics = await courseService.getInstructorAnalytics(
        instructorId.toString(),
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch instructor analytics",
      });
    }
  }

  // ============= FEATURED & RECOMMENDATIONS =============

  async getFeaturedCourses(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const courses = await courseService.getFeaturedCourses(limit);

      res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch featured courses",
      });
    }
  }

  async getRecommendedCourses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        // Return featured courses if not logged in
        const courses = await courseService.getFeaturedCourses();
        res.status(200).json({
          success: true,
          data: courses,
        });
        return;
      }

      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const courses = await courseService.getRecommendedCourses(
        userId.toString(),
        limit,
      );

      res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch recommended courses",
      });
    }
  }

  async getCoursesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const options = req.query;

      const result = await courseService.getCoursesByCategory(
        categoryId,
        options,
      );

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
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch courses by category",
      });
    }
  }
}

export default new CourseController();
