import mongoose from "mongoose";
import { Request, Response } from "express";
import { Design } from "./design.model";
import { Category } from "../category/category.model";

const getAllDesigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      complexityLevel,
      status = "Active",
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      search,
    } = req.query;

  
    const filter: Record<string, unknown> = { isDeleted: false };

    if (status) filter.status = status;
    if (complexityLevel) filter.complexityLevel = complexityLevel;

    // ✅ CATEGORY HANDLING FIX
    if (category) {
      const categoryId = new mongoose.Types.ObjectId(category as string);

      // Check if the category is active and not deleted
      const categoryExists = await Category.exists({
        _id: categoryId,
        isActive: true,
        isDeleted: false,
      });

      if (categoryExists) {
        filter.category = categoryId;
      } else {
        // If category is inactive/deleted → return empty result immediately
         res.status(200).json({
          success: true,
          message: "No designs found for this category (inactive or deleted).",
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit as string, 10),
            hasNextPage: false,
            hasPrevPage: false,
          },
          filters: {
            category: category || null,
            complexityLevel: complexityLevel || null,
            status: status || "Active",
            priceRange: {
              min: minPrice ? parseFloat(minPrice as string) : null,
              max: maxPrice ? parseFloat(maxPrice as string) : null,
            },
            search: search || null,
          },
        });
      }
    }

    // ✅ Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {} as { $gte?: number; $lte?: number };
      if (minPrice !== undefined) {
        (filter.price as { $gte?: number; $lte?: number }).$gte = parseFloat(
          minPrice as string,
        );
      }
      if (maxPrice !== undefined) {
        (filter.price as { $gte?: number; $lte?: number }).$lte = parseFloat(
          maxPrice as string,
        );
      }
    }

    // ✅ Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search as string, "i")] } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // ✅ Aggregation pipeline (unchanged)
    const designsWithRating = await Design.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $match: {
          "category.isDeleted": false,
          "category.isActive": true,
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "design",
          as: "reviews",
        },
      },
      {
        $addFields: {
          avgRating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
          totalReviews: { $size: "$reviews" },
        },
      },
      {
        $project: {
          reviews: 0,
          "category.isDeleted": 0,
          "category.__v": 0,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
    ]);

    const totalDesigns = designsWithRating.length;
    const totalPages = Math.ceil(totalDesigns / limitNum);

    res.status(200).json({
      success: true,
      message: "Designs retrieved successfully",
      data: designsWithRating,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalDesigns,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        category: category || null,
        complexityLevel: complexityLevel || null,
        status: status || "Active",
        priceRange: {
          min: minPrice ? parseFloat(minPrice as string) : null,
          max: maxPrice ? parseFloat(maxPrice as string) : null,
        },
        search: search || null,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to get designs",
      error: errorMessage,
    });
  }
};


const getSingleDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const design = await Design.findById(req.params.id).populate(
      "category",
      "name description",
    );

    if (!design) {
      res.status(404).json({
        success: false,
        message: "Design not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Design retrieved successfully",
      data: design,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to get design",
      error: errorMessage,
    });
  }
};

// Create new design (Admin only)
const createNewDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const design = new Design(req.body);
    await design.save();

    const populatedDesign = await Design.findById(design._id).populate(
      "category",
      "name description isActive",
    );

    res.status(201).json({
      success: true,
      message: "Design created successfully",
      data: populatedDesign,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to create design",
      error: errorMessage,
    });
  }
};

// Update design (Admin only)
const updateDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const design = await Design.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("category", "name description isActive");

    if (!design) {
      res.status(404).json({
        success: false,
        message: "Design not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Design updated successfully",
      data: design,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to update design",
      error: errorMessage,
    });
  }
};

// Delete design (Admin only)
const deleteDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const design = await Design.findByIdAndUpdate({
      _id: req.params.id,
      isDeleted: true,
    });

    if (!design) {
      res.status(404).json({
        success: false,
        message: "Design not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Design deleted successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to delete design",
      error: errorMessage,
    });
  }
};

export {
  getAllDesigns,
  getSingleDesign,
  createNewDesign,
  updateDesign,
  deleteDesign,
};
