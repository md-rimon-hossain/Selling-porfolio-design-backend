import { Request, Response } from "express";
import { Category } from "./category.model";

// Simple slugify - match model logic so frontend can predict slugs if needed
function simpleSlugify(input: string) {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Get all categories (Public)
const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    // support optional pagination and search for frontend convenience
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      isActive: true,
      isDeleted: false,
      parentCategory: null,
    };

    // Filter by categoryType (design or course)
    if (req.query.categoryType) {
      filter.categoryType = req.query.categoryType;
    }

    if (req.query.search) {
      filter.name = { $regex: String(req.query.search), $options: "i" };
    }

    const total = await Category.countDocuments(filter);

    const categories = await Category.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "subcategories",
        populate: {
          path: "parentCategory",
          select: "name description",
        },
      });

    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to get categories",
      error: errorMessage,
    });
  }
};

// Get single category by ID (Public)
const getSingleCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id)
      .populate("parentCategory")
      .populate("subcategories");

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category retrieved successfully",
      data: category,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to get category",
      error: errorMessage,
    });
  }
};

// Create new category (Admin only)
const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    // allow frontend to omit parentCategory or send null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { ...req.body };
    if (!payload.parentCategory) payload.parentCategory = null;

    const category = new Category(payload);
    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: errorMessage,
    });
  }
};

// Update category (Admin only)
const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = { ...req.body };
    if (update.name || update.categoryType) {
      // Fetch existing category to get categoryType if not in update
      const existingCategory = await Category.findById(req.params.id);
      if (!existingCategory) {
        res.status(404).json({
          success: false,
          message: "Category not found",
        });
        return;
      }
      const categoryType = update.categoryType || existingCategory.categoryType;
      const name = update.name || existingCategory.name;
      // keep slug in sync when updating name or categoryType (findByIdAndUpdate won't trigger pre-save)
      update.slug = `${categoryType}-${simpleSlugify(name)}`;
    }

    const category = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: errorMessage,
    });
  }
};

// Delete category (Admin only)
const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, isActive: false },
      { new: true },
    );

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: errorMessage,
    });
  }
};

export {
  getAllCategories,
  getSingleCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
