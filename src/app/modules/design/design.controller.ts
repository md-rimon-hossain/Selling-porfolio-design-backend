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

    // Build filter object
    const filter: Record<string, unknown> = {
      isDeleted: false, // Exclude deleted designs
    };

    // Status filter (default to Active if not specified)
    if (status) {
      filter.status = status;
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Complexity level filter
    if (complexityLevel) {
      filter.complexityLevel = complexityLevel;
    }

    // Price range filter
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

    // Search filter (search in title, description, and tags)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search as string, "i")] } },
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get active category IDs first
    
      const activeCategories = await Category.find({
      isActive: true,
      isDeleted: false,
    }).distinct("_id");
    

    // Add active category filter to main filter
    filter.category = { $in: activeCategories };

    // Get total count for pagination (only designs with active categories)
    const totalDesigns = await Design.countDocuments(filter);
    const totalPages = Math.ceil(totalDesigns / limitNum);

    // Fetch designs with filters, pagination, and population
    const designs = await Design.find(filter)
      .populate("category", "name description isActive")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      message: "Designs retrieved successfully",
      data: designs,
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
