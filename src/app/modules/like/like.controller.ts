import { Response } from "express";
import { Types } from "mongoose";
import { Like } from "./like.model";
import { Design } from "../design/design.model";
import { AuthRequest } from "../../middlewares/auth";

// Toggle like on a design (like/unlike)
export const toggleLikeDesign = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { designId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(designId)) {
      res.status(400).json({
        success: false,
        message: "Invalid design ID format",
      });
      return;
    }

    // Check if design exists
    const design = await Design.findById(designId);
    if (!design) {
      res.status(404).json({
        success: false,
        message: "Design not found",
      });
      return;
    }

    // Check if user already liked this design
    const existingLike = await Like.findOne({
      user: userId,
      design: designId,
    });

    if (existingLike) {
      // Unlike: Remove the like
      await Like.findByIdAndDelete(existingLike._id);

      // Decrement the like count
      await Design.findByIdAndUpdate(
        designId,
        { $inc: { likesCount: -1 } },
        { new: true },
      );

      res.status(200).json({
        success: true,
        message: "Design unliked successfully",
        data: {
          liked: false,
          likesCount: design.likesCount - 1,
        },
      });
    } else {
      // Like: Add new like
      const newLike = new Like({
        user: userId,
        design: designId,
      });

      await newLike.save();

      // Increment the like count
      await Design.findByIdAndUpdate(
        designId,
        { $inc: { likesCount: 1 } },
        { new: true },
      );

      res.status(200).json({
        success: true,
        message: "Design liked successfully",
        data: {
          liked: true,
          likesCount: design.likesCount + 1,
        },
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error toggling like:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get user's liked designs
export const getUserLikedDesigns = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get user's likes with populated design information
    const likes = await Like.find({ user: userId })
      .populate({
        path: "design",
        select:
          "title previewImageUrl price designerName likesCount downloadCount status",
        populate: {
          path: "category",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalLikes = await Like.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalLikes / limitNum);

    res.status(200).json({
      success: true,
      message: "Liked designs retrieved successfully",
      data: likes,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalLikes,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching liked designs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Check if user liked a specific design
export const checkIfUserLikedDesign = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { designId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(designId)) {
      res.status(400).json({
        success: false,
        message: "Invalid design ID format",
      });
      return;
    }

    const like = await Like.findOne({
      user: userId,
      design: designId,
    });

    res.status(200).json({
      success: true,
      message: "Like status retrieved successfully",
      data: {
        liked: !!like,
        likedAt: like?.createdAt || null,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error checking like status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get users who liked a design (Admin only)
export const getDesignLikers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { designId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!Types.ObjectId.isValid(designId)) {
      res.status(400).json({
        success: false,
        message: "Invalid design ID format",
      });
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const likes = await Like.find({ design: designId })
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalLikes = await Like.countDocuments({ design: designId });
    const totalPages = Math.ceil(totalLikes / limitNum);

    res.status(200).json({
      success: true,
      message: "Design likers retrieved successfully",
      data: likes,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalLikes,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching design likers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
