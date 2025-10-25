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
// Get all categories (Public)
const getAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield category_model_1.Category.find({ isActive: true });
        res.status(200).json({
            success: true,
            message: "Categories retrieved successfully",
            data: categories,
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
        const category = yield category_model_1.Category.findById(req.params.id);
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
        const category = new category_model_1.Category(req.body);
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
        const category = yield category_model_1.Category.findByIdAndUpdate(req.params.id, req.body, {
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
        const category = yield category_model_1.Category.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
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
