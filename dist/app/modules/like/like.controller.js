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
exports.getDesignLikers = exports.checkIfUserLikedDesign = exports.getUserLikedDesigns = exports.toggleLikeDesign = void 0;
const mongoose_1 = require("mongoose");
const like_model_1 = require("./like.model");
const design_model_1 = require("../design/design.model");
// Toggle like on a design (like/unlike)
const toggleLikeDesign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { designId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(designId)) {
            res.status(400).json({
                success: false,
                message: "Invalid design ID format",
            });
            return;
        }
        // Check if design exists
        const design = yield design_model_1.Design.findById(designId);
        if (!design) {
            res.status(404).json({
                success: false,
                message: "Design not found",
            });
            return;
        }
        // Check if user already liked this design
        const existingLike = yield like_model_1.Like.findOne({
            user: userId,
            design: designId,
        });
        if (existingLike) {
            // Unlike: Remove the like
            yield like_model_1.Like.findByIdAndDelete(existingLike._id);
            // Decrement the like count and get updated design
            const updatedDesign = yield design_model_1.Design.findByIdAndUpdate(designId, { $inc: { likesCount: -1 } }, { new: true });
            res.status(200).json({
                success: true,
                message: "Design unliked successfully",
                data: {
                    liked: false,
                    likesCount: (updatedDesign === null || updatedDesign === void 0 ? void 0 : updatedDesign.likesCount) || 0,
                },
            });
        }
        else {
            // Like: Add new like
            const newLike = new like_model_1.Like({
                user: userId,
                design: designId,
            });
            yield newLike.save();
            // Increment the like count and get updated design
            const updatedDesign = yield design_model_1.Design.findByIdAndUpdate(designId, { $inc: { likesCount: 1 } }, { new: true });
            res.status(200).json({
                success: true,
                message: "Design liked successfully",
                data: {
                    liked: true,
                    likesCount: (updatedDesign === null || updatedDesign === void 0 ? void 0 : updatedDesign.likesCount) || 0,
                },
            });
        }
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error toggling like:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.toggleLikeDesign = toggleLikeDesign;
// Get user's liked designs
const getUserLikedDesigns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { page = 1, limit = 10 } = req.query;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Get user's likes with populated design information
        const likes = yield like_model_1.Like.find({ user: userId })
            .populate({
            path: "design",
            select: "title previewImageUrls price designer likesCount downloadCount status",
            populate: {
                path: "parentCategory subCategory designer",
                select: "name",
            },
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const totalLikes = yield like_model_1.Like.countDocuments({ user: userId });
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
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching liked designs:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getUserLikedDesigns = getUserLikedDesigns;
// Check if user liked a specific design
const checkIfUserLikedDesign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { designId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(designId)) {
            res.status(400).json({
                success: false,
                message: "Invalid design ID format",
            });
            return;
        }
        const like = yield like_model_1.Like.findOne({
            user: userId,
            design: designId,
        });
        res.status(200).json({
            success: true,
            message: "Like status retrieved successfully",
            data: {
                liked: !!like,
                likedAt: (like === null || like === void 0 ? void 0 : like.createdAt) || null,
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error checking like status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.checkIfUserLikedDesign = checkIfUserLikedDesign;
// Get users who liked a design (Admin only)
const getDesignLikers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { designId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        if (!mongoose_1.Types.ObjectId.isValid(designId)) {
            res.status(400).json({
                success: false,
                message: "Invalid design ID format",
            });
            return;
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const likes = yield like_model_1.Like.find({ design: designId })
            .populate("user", "name email profileImage")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const totalLikes = yield like_model_1.Like.countDocuments({ design: designId });
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
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching design likers:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getDesignLikers = getDesignLikers;
