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
exports.getReviewAnalytics = exports.markReviewHelpful = exports.deleteReview = exports.updateReview = exports.getReviewById = exports.getSingleDesignReviews = exports.getAllReviews = exports.createReview = void 0;
const mongoose_1 = require("mongoose");
const review_model_1 = require("./review.model");
const design_model_1 = require("../design/design.model");
const purchase_model_1 = require("../purchase/purchase.model");
// Create a new review
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { designId, rating, comment, title } = req.body;
        // Check if design exists
        const designExists = yield design_model_1.Design.findById({
            _id: designId,
            isDeleted: false,
        });
        if (!designExists) {
            res.status(404).json({
                success: false,
                message: "Design not found or has been deleted!",
            });
        }
        const eligibleToReview = yield purchase_model_1.Purchase.findOne({
            design: designId,
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
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
        const existingReview = yield review_model_1.Review.findOne({
            design: designId,
            reviewer: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
        });
        if (existingReview) {
            res.status(409).json({
                success: false,
                message: "You have already reviewed this design",
            });
            return;
        }
        const newReview = new review_model_1.Review({
            design: designId,
            reviewer: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
            rating,
            comment,
            title,
            isHelpful: false,
        });
        const savedReview = yield newReview.save();
        // Populate the review with design and reviewer details
        const populatedReview = yield review_model_1.Review.findById(savedReview._id)
            .populate("design", "title description")
            .populate("reviewer", "name email");
        // Update design average rating
        yield updateDesignRating(designId);
        res.status(201).json({
            success: true,
            message: "Review created successfully",
            data: populatedReview,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error creating review:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.createReview = createReview;
// Get all reviews (Admin only)
const getAllReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", design, reviewer, rating, minRating, maxRating, search, } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Build filter object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter = {};
        if (design) {
            filter.design = design;
        }
        if (reviewer) {
            filter.reviewer = reviewer;
        }
        if (rating) {
            filter.rating = parseInt(rating, 10);
        }
        if (minRating) {
            filter.rating = Object.assign(Object.assign({}, filter.rating), { $gte: parseInt(minRating, 10) });
        }
        if (maxRating) {
            filter.rating = Object.assign(Object.assign({}, filter.rating), { $lte: parseInt(maxRating, 10) });
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
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        const reviews = yield review_model_1.Review.find(filter)
            .populate("design", "title description price")
            .populate("reviewer", "name email")
            .sort(sort)
            .skip(skip)
            .limit(limitNum);
        const totalReviews = yield review_model_1.Review.countDocuments(filter);
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
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching reviews:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getAllReviews = getAllReviews;
// Get reviews for a specific design
const getSingleDesignReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { designId } = req.params;
        const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", rating, minRating, maxRating, } = req.query;
        if (!mongoose_1.Types.ObjectId.isValid(designId)) {
            res.status(400).json({
                success: false,
                message: "Invalid design ID format",
            });
        }
        // Check if design exists
        const designExists = yield design_model_1.Design.findById(designId);
        if (!designExists) {
            res.status(404).json({
                success: false,
                message: "Design not found",
            });
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Build filter object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter = { design: designId };
        if (rating) {
            filter.rating = parseInt(rating, 10);
        }
        if (minRating) {
            filter.rating = Object.assign(Object.assign({}, filter.rating), { $gte: parseInt(minRating, 10) });
        }
        if (maxRating) {
            filter.rating = Object.assign(Object.assign({}, filter.rating), { $lte: parseInt(maxRating, 10) });
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        const reviews = yield review_model_1.Review.find(filter)
            .populate("reviewer", "name")
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .select("-__v");
        const totalReviews = yield review_model_1.Review.countDocuments(filter);
        const totalPages = Math.ceil(totalReviews / limitNum);
        // Get rating statistics
        const ratingStats = yield review_model_1.Review.aggregate([
            { $match: { design: new mongoose_1.Types.ObjectId(designId) } },
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
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching design reviews:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getSingleDesignReviews = getSingleDesignReviews;
// Get single review by ID
const getReviewById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid review ID format",
            });
        }
        const review = yield review_model_1.Review.findById(id)
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
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching review:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getReviewById = getReviewById;
// Update review (Only by review author or admin)
const updateReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid review ID format",
            });
        }
        const review = yield review_model_1.Review.findById(id);
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found",
            });
            return;
        }
        // Check if user is authorized to update this review
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin" &&
            ((_b = review.reviewer) === null || _b === void 0 ? void 0 : _b.toString()) !== ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString())) {
            res.status(403).json({
                success: false,
                message: "Not authorized to update this review",
            });
            return;
        }
        const updatedReview = yield review_model_1.Review.findByIdAndUpdate(id, Object.assign(Object.assign({}, updateData), { updatedAt: new Date() }), { new: true, runValidators: true })
            .populate("design", "title description")
            .populate("reviewer", "name email");
        // Update design average rating if rating was changed
        if (updateData.rating) {
            yield updateDesignRating(review.design);
        }
        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: updatedReview,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error updating review:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateReview = updateReview;
// Delete review (Only by review author or admin)
const deleteReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid review ID format",
            });
        }
        const review = yield review_model_1.Review.findById(id);
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found",
            });
            return;
        }
        // Check if user is authorized to delete this review
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin" &&
            ((_b = review.reviewer) === null || _b === void 0 ? void 0 : _b.toString()) !== ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString())) {
            res.status(403).json({
                success: false,
                message: "Not authorized to delete this review",
            });
            return;
        }
        const designId = review.design;
        yield review_model_1.Review.findByIdAndDelete(id);
        // Update design average rating after deletion
        yield updateDesignRating(designId);
        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error deleting review:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.deleteReview = deleteReview;
// Mark review as helpful/unhelpful
const markReviewHelpful = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const { isHelpful } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid review ID format",
            });
            return;
        }
        const review = yield review_model_1.Review.findById(id);
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found",
            });
            return;
        }
        // Users cannot mark their own reviews as helpful
        if (((_a = review.reviewer) === null || _a === void 0 ? void 0 : _a.toString()) === ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id)) {
            res.status(400).json({
                success: false,
                message: "You cannot mark your own review as helpful",
            });
            return;
        }
        const updatedReview = yield review_model_1.Review.findByIdAndUpdate(id, {
            isHelpful,
        }, { new: true }).populate("reviewer", "name");
        res.status(200).json({
            success: true,
            message: `Review marked as ${isHelpful ? "helpful" : "not helpful"}`,
            data: updatedReview,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error marking review helpful:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.markReviewHelpful = markReviewHelpful;
// Get review analytics (Admin only) - overall stats, rating distribution, top reviewed designs, active reviewers
const getReviewAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { period = "monthly", startDate, endDate, designId } = req.query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let dateFilter = {};
        const now = new Date();
        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            };
        }
        else {
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
            dateFilter.design = new mongoose_1.Types.ObjectId(designId);
        }
        // Get overall review statistics
        const overallStats = yield review_model_1.Review.aggregate([
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
        const ratingDistribution = yield review_model_1.Review.aggregate([
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
        const topReviewedDesigns = yield review_model_1.Review.aggregate([
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
        const topReviewers = yield review_model_1.Review.aggregate([
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
                    startDate: ((_a = dateFilter.createdAt) === null || _a === void 0 ? void 0 : _a.$gte) || "All time",
                    endDate: ((_b = dateFilter.createdAt) === null || _b === void 0 ? void 0 : _b.$lte) || "Present",
                },
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching review analytics:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getReviewAnalytics = getReviewAnalytics;
// Helper function to update design average rating
const updateDesignRating = (designId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ratingStats = yield review_model_1.Review.aggregate([
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
        yield design_model_1.Design.findByIdAndUpdate(designId, {
            averageRating: stats ? Number(stats.averageRating.toFixed(1)) : 0,
            totalReviews: stats ? stats.totalReviews : 0,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error updating design rating:", error);
    }
});
