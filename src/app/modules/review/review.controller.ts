import { Request, Response } from "express";
import { Types } from "mongoose";
import { Review } from "./review.model";
import { Design } from "../design/design.model";
import { AuthRequest } from "../../middlewares/auth";
import { Purchase } from "../purchase/purchase.model";

// Create a new review
export const createReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { designId, rating, comment, title } = req.body;

    // Check if design exists
    const designExists = await Design.findById({
      _id: designId,
      isDeleted: false,
    });

    if (!designExists) {
      res.status(404).json({
        success: false,
        message: "Design not found or has been deleted!",
      });
    }


    const eligibleToReview = await Purchase.findOne({
      design: designId,
      user: req.user?._id,
      status: "completed",
    });

    
    if (!eligibleToReview) {  
      res.status(403).json({
        success: false,
        message: "You can only review designs you have purchased!",
      });
      return;
    }

    // Check if user has already reviewed this design
    const existingReview = await Review.findOne({
      design: designId,
      reviewer: req.user?._id,
    });



    if (existingReview) {
      res.status(409).json({
        success: false,
        message: "You have already reviewed this design",
      });
      return;
    }

    const newReview = new Review({
      design: designId,
      reviewer: req.user?._id,
      rating,
      comment,
      title,
      isHelpful: false,
    });

    const savedReview = await newReview.save();

    // Populate the review with design and reviewer details
    const populatedReview = await Review.findById(savedReview._id)
      .populate("design", "title description")
      .populate("reviewer", "name email");

    // Update design average rating
    await updateDesignRating(designId);

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: populatedReview,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all reviews (Admin only)
export const getAllReviews = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      design,
      reviewer,
      rating,
      minRating,
      maxRating,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (design) {
      filter.design = design;
    }

    if (reviewer) {
      filter.reviewer = reviewer;
    }

    if (rating) {
      filter.rating = parseInt(rating as string, 10);
    }

    if (minRating) {
      filter.rating = {
        ...filter.rating,
        $gte: parseInt(minRating as string, 10),
      };
    }

    if (maxRating) {
      filter.rating = {
        ...filter.rating,
        $lte: parseInt(maxRating as string, 10),
      };
    }

    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { pros: { $elemMatch: { $regex: search, $options: "i" } } },
        { cons: { $elemMatch: { $regex: search, $options: "i" } } },
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const reviews = await Review.find(filter)
      .populate("design", "title description price")
      .populate("reviewer", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const totalReviews = await Review.countDocuments(filter);
    const totalPages = Math.ceil(totalReviews / limitNum);

    res.status(200).json({
      success: true,
      message: "Reviews retrieved successfully",
      data: reviews,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalReviews,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get reviews for a specific design
export const getSingleDesignReviews = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { designId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      rating,
      minRating,
      maxRating,
    } = req.query;

    if (!Types.ObjectId.isValid(designId)) {
      res.status(400).json({
        success: false,
        message: "Invalid design ID format",
      });
    }

    // Check if design exists
    const designExists = await Design.findById(designId);
    if (!designExists) {
      res.status(404).json({
        success: false,
        message: "Design not found",
      });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { design: designId };

    if (rating) {
      filter.rating = parseInt(rating as string, 10);
    }

    if (minRating) {
      filter.rating = {
        ...filter.rating,
        $gte: parseInt(minRating as string, 10),
      };
    }

    if (maxRating) {
      filter.rating = {
        ...filter.rating,
        $lte: parseInt(maxRating as string, 10),
      };
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const reviews = await Review.find(filter)
      .populate("reviewer", "name")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    const totalReviews = await Review.countDocuments(filter);
    const totalPages = Math.ceil(totalReviews / limitNum);

    // Get rating statistics
    const ratingStats = await Review.aggregate([
      { $match: { design: new Types.ObjectId(designId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
      {
        $project: {
          averageRating: { $round: ["$averageRating", 1] },
          totalReviews: 1,
          ratingDistribution: {
            5: {
              $size: {
                $filter: {
                  input: "$ratingDistribution",
                  cond: { $eq: ["$$this", 5] },
                },
              },
            },
            4: {
              $size: {
                $filter: {
                  input: "$ratingDistribution",
                  cond: { $eq: ["$$this", 4] },
                },
              },
            },
            3: {
              $size: {
                $filter: {
                  input: "$ratingDistribution",
                  cond: { $eq: ["$$this", 3] },
                },
              },
            },
            2: {
              $size: {
                $filter: {
                  input: "$ratingDistribution",
                  cond: { $eq: ["$$this", 2] },
                },
              },
            },
            1: {
              $size: {
                $filter: {
                  input: "$ratingDistribution",
                  cond: { $eq: ["$$this", 1] },
                },
              },
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Design reviews retrieved successfully",
      data: {
        reviews,
        statistics: ratingStats[0] || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      },
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalReviews,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching design reviews:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get single review by ID
export const getReviewById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid review ID format",
      });
    }

    const review = await Review.findById(id)
      .populate("design", "title description price")
      .populate("reviewer", "name email")
      .select("-__v");

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Review retrieved successfully",
      data: review,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update review (Only by review author or admin)
export const updateReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid review ID format",
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    // Check if user is authorized to update this review
    if (
      req.user?.role !== "admin" &&
      review.reviewer?.toString() !== req.user?._id?.toString()
    ) {
      res.status(403).json({
        success: false,
        message: "Not authorized to update this review",
      });
      return;
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true },
    )
      .populate("design", "title description")
      .populate("reviewer", "name email");

    // Update design average rating if rating was changed
    if (updateData.rating) {
      await updateDesignRating(review.design);
    }

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete review (Only by review author or admin)
export const deleteReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid review ID format",
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    // Check if user is authorized to delete this review
    if (
      req.user?.role !== "admin" &&
      review.reviewer?.toString() !== req.user?._id?.toString()
    ) {
      res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      });
      return;
    }

    const designId = review.design;
    await Review.findByIdAndDelete(id);

    // Update design average rating after deletion
    await updateDesignRating(designId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Mark review as helpful/unhelpful
export const markReviewHelpful = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isHelpful } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid review ID format",
      });
      return;
    }

    const review = await Review.findById(id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    // Users cannot mark their own reviews as helpful
    if (review.reviewer?.toString() === req.user?._id) {
      res.status(400).json({
        success: false,
        message: "You cannot mark your own review as helpful",
      });
      return;
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      {
        isHelpful,
      },
      { new: true },
    ).populate("reviewer", "name");

    res.status(200).json({
      success: true,
      message: `Review marked as ${isHelpful ? "helpful" : "not helpful"}`,
      data: updatedReview,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error marking review helpful:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get review analytics (Admin only) - overall stats, rating distribution, top reviewed designs, active reviewers
export const getReviewAnalytics = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { period = "monthly", startDate, endDate, designId } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dateFilter: Record<string, any> = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        },
      };
    } else {
      // Default period-based filtering
      switch (period) {
        case "daily":
          dateFilter.createdAt = {
            $gte: new Date(now.setDate(now.getDate() - 1)),
          };
          break;
        case "weekly":
          dateFilter.createdAt = {
            $gte: new Date(now.setDate(now.getDate() - 7)),
          };
          break;
        case "monthly":
          dateFilter.createdAt = {
            $gte: new Date(now.setMonth(now.getMonth() - 1)),
          };
          break;
        case "yearly":
          dateFilter.createdAt = {
            $gte: new Date(now.setFullYear(now.getFullYear() - 1)),
          };
          break;
      }
    }

    // Add design filter if specified
    if (designId) {
      dateFilter.design = new Types.ObjectId(designId as string);
    }

    // Get overall review statistics
    const overallStats = await Review.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          helpfulReviews: {
            $sum: { $cond: [{ $eq: ["$isHelpful", true] }, 1, 0] },
          },
        },
      },
    ]);

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    // Get top reviewed designs
    const topReviewedDesigns = await Review.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$design",
          reviewCount: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
      {
        $lookup: {
          from: "designs",
          localField: "_id",
          foreignField: "_id",
          as: "designDetails",
        },
      },
      {
        $unwind: "$designDetails",
      },
      {
        $project: {
          designTitle: "$designDetails.title",
          reviewCount: 1,
          averageRating: { $round: ["$averageRating", 1] },
        },
      },
      { $sort: { reviewCount: -1 } },
      { $limit: 10 },
    ]);

    // Get most active reviewers
    const topReviewers = await Review.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$reviewer",
          reviewCount: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "reviewerDetails",
        },
      },
      {
        $unwind: "$reviewerDetails",
      },
      {
        $project: {
          reviewerName: "$reviewerDetails.name",
          reviewCount: 1,
          averageRating: { $round: ["$averageRating", 1] },
        },
      },
      { $sort: { reviewCount: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      message: "Review analytics retrieved successfully",
      data: {
        overview: overallStats[0] || {
          totalReviews: 0,
          averageRating: 0,
          helpfulReviews: 0,
        },
        ratingDistribution,
        topReviewedDesigns,
        topReviewers,
        period,
        dateRange: {
          startDate: dateFilter.createdAt?.$gte || "All time",
          endDate: dateFilter.createdAt?.$lte || "Present",
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching review analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Helper function to update design average rating
const updateDesignRating = async (designId: Types.ObjectId): Promise<void> => {
  try {
    const ratingStats = await Review.aggregate([
      { $match: { design: designId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const stats = ratingStats[0];

    await Design.findByIdAndUpdate(designId, {
      averageRating: stats ? Number(stats.averageRating.toFixed(1)) : 0,
      totalReviews: stats ? stats.totalReviews : 0,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error updating design rating:", error);
  }
};
