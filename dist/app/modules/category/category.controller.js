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
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getSingleCategory = exports.getAllCategories = void 0;
const category_model_1 = require("./category.model");
// Simple slugify - match model logic so frontend can predict slugs if needed
function simpleSlugify(input) {
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
const getAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // support optional pagination and search for frontend convenience
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter = {
            isActive: true,
            isDeleted: false,
            parentCategory: null,
        };
        if (req.query.search) {
            filter.name = { $regex: String(req.query.search), $options: "i" };
        }
        const total = yield category_model_1.Category.countDocuments(filter);
        const categories = yield category_model_1.Category.find(filter)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .populate({
            path: "subcategories",
            populate: {
                path: "parentCategory",
                select: "name description"
            }
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to get categories",
            error: errorMessage,
        });
    }
});
exports.getAllCategories = getAllCategories;
// Get single category by ID (Public)
const getSingleCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield category_model_1.Category.findById(req.params.id)
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to get category",
            error: errorMessage,
        });
    }
});
exports.getSingleCategory = getSingleCategory;
// Create new category (Admin only)
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // allow frontend to omit parentCategory or send null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload = Object.assign({}, req.body);
        if (!payload.parentCategory)
            payload.parentCategory = null;
        const category = new category_model_1.Category(payload);
        yield category.save();
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to create category",
            error: errorMessage,
        });
    }
});
exports.createCategory = createCategory;
// Update category (Admin only)
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const update = Object.assign({}, req.body);
        if (update.name) {
            // keep slug in sync when updating name (findByIdAndUpdate won't trigger pre-save)
            update.slug = simpleSlugify(update.name);
        }
        const category = yield category_model_1.Category.findByIdAndUpdate(req.params.id, update, {
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to update category",
            error: errorMessage,
        });
    }
});
exports.updateCategory = updateCategory;
// Delete category (Admin only)
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield category_model_1.Category.findByIdAndUpdate(req.params.id, { isDeleted: true, isActive: false }, { new: true });
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to delete category",
            error: errorMessage,
        });
    }
});
exports.deleteCategory = deleteCategory;
