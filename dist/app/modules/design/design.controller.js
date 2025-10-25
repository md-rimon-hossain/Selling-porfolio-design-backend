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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDesign = exports.updateDesign = exports.createNewDesign = exports.getSingleDesign = exports.getAllDesigns = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const design_model_1 = require("./design.model");
const category_model_1 = require("../category/category.model");
const getAllDesigns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, complexityLevel, status = "Active", minPrice, maxPrice, page = 1, limit = 10, search, } = req.query;
        const filter = { isDeleted: false };
        if (status)
            filter.status = status;
        if (complexityLevel)
            filter.complexityLevel = complexityLevel;
        // ✅ CATEGORY HANDLING FIX
        if (category) {
            const categoryId = new mongoose_1.default.Types.ObjectId(category);
            // Check if the category is active and not deleted
            const categoryExists = yield category_model_1.Category.exists({
                _id: categoryId,
                isActive: true,
                isDeleted: false,
            });
            if (categoryExists) {
                filter.category = categoryId;
            }
            else {
                // If category is inactive/deleted → return empty result immediately
                res.status(200).json({
                    success: true,
                    message: "No designs found for this category (inactive or deleted).",
                    data: [],
                    pagination: {
                        currentPage: 1,
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: parseInt(limit, 10),
                        hasNextPage: false,
                        hasPrevPage: false,
                    },
                    filters: {
                        category: category || null,
                        complexityLevel: complexityLevel || null,
                        status: status || "Active",
                        priceRange: {
                            min: minPrice ? parseFloat(minPrice) : null,
                            max: maxPrice ? parseFloat(maxPrice) : null,
                        },
                        search: search || null,
                    },
                });
            }
        }
        // ✅ Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) {
                filter.price.$gte = parseFloat(minPrice);
            }
            if (maxPrice !== undefined) {
                filter.price.$lte = parseFloat(maxPrice);
            }
        }
        // ✅ Search filter
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } },
            ];
        }
        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // ✅ Aggregation pipeline (unchanged)
        const designsWithRating = yield design_model_1.Design.aggregate([
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
                    min: minPrice ? parseFloat(minPrice) : null,
                    max: maxPrice ? parseFloat(maxPrice) : null,
                },
                search: search || null,
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to get designs",
            error: errorMessage,
        });
    }
});
exports.getAllDesigns = getAllDesigns;
const getSingleDesign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const design = yield design_model_1.Design.findById(req.params.id).populate("category", "name description");
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to get design",
            error: errorMessage,
        });
    }
});
exports.getSingleDesign = getSingleDesign;
// Create new design (Admin only)
const createNewDesign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const design = new design_model_1.Design(req.body);
        yield design.save();
        const populatedDesign = yield design_model_1.Design.findById(design._id).populate("category", "name description isActive");
        res.status(201).json({
            success: true,
            message: "Design created successfully",
            data: populatedDesign,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to create design",
            error: errorMessage,
        });
    }
});
exports.createNewDesign = createNewDesign;
// Update design (Admin only)
const updateDesign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const design = yield design_model_1.Design.findByIdAndUpdate(req.params.id, req.body, {
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to update design",
            error: errorMessage,
        });
    }
});
exports.updateDesign = updateDesign;
// Delete design (Admin only)
const deleteDesign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const design = yield design_model_1.Design.findByIdAndUpdate({
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to delete design",
            error: errorMessage,
        });
    }
});
exports.deleteDesign = deleteDesign;
