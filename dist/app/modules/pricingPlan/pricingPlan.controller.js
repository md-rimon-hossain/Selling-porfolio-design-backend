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
exports.getPricingPlanAnalytics = exports.deletePricingPlan = exports.updatePricingPlan = exports.getPricingPlanById = exports.getActivePricingPlans = exports.getAllPricingPlans = exports.createPricingPlan = void 0;
const mongoose_1 = require("mongoose");
const pricingPlan_model_1 = require("./pricingPlan.model");
const purchase_model_1 = require("../purchase/purchase.model");
// Create a new pricing plan (Admin only)
const createPricingPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, price, duration, features, maxDesigns, maxDownloads, priority, isActive, discountPercentage, validUntil, } = req.body;
        // Check if pricing plan with same name already exists and is active
        const existingPlan = yield pricingPlan_model_1.PricingPlan.findOne({
            name: name.toLowerCase(),
            isActive: true,
        });
        if (existingPlan) {
            res.status(409).json({
                success: false,
                message: "Pricing plan with this name already exists",
            });
            return;
        }
        // Calculate discounted price if discount is provided
        let finalPrice = price;
        if (discountPercentage && discountPercentage > 0) {
            finalPrice = price - (price * discountPercentage) / 100;
        }
        const newPricingPlan = new pricingPlan_model_1.PricingPlan({
            name: name.toLowerCase(),
            description,
            price,
            finalPrice,
            duration,
            features,
            maxDesigns,
            maxDownloads,
            priority: priority !== undefined ? priority : 1,
            isActive: isActive !== undefined ? isActive : true,
            discountPercentage: discountPercentage !== undefined ? discountPercentage : 0,
            validUntil: validUntil ? new Date(validUntil) : undefined,
        });
        const savedPlan = yield newPricingPlan.save();
        res.status(201).json({
            success: true,
            message: "Pricing plan created successfully",
            data: savedPlan,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error creating pricing plan:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.createPricingPlan = createPricingPlan;
// Get all pricing plans
const getAllPricingPlans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, sortBy = "priority", sortOrder = "asc", isActive, minPrice, maxPrice, search, } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Build filter object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }
        if (minPrice) {
            filter.finalPrice = Object.assign(Object.assign({}, filter.finalPrice), { $gte: parseFloat(minPrice) });
        }
        if (maxPrice) {
            filter.finalPrice = Object.assign(Object.assign({}, filter.finalPrice), { $lte: parseFloat(maxPrice) });
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { features: { $elemMatch: { $regex: search, $options: "i" } } },
            ];
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        const pricingPlans = yield pricingPlan_model_1.PricingPlan.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .select("-__v");
        const totalPlans = yield pricingPlan_model_1.PricingPlan.countDocuments(filter);
        const totalPages = Math.ceil(totalPlans / limitNum);
        res.status(200).json({
            success: true,
            message: "Pricing plans retrieved successfully",
            data: pricingPlans,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: totalPlans,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching pricing plans:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getAllPricingPlans = getAllPricingPlans;
// Get active pricing plans only (for public view)
const getActivePricingPlans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pricingPlans = yield pricingPlan_model_1.PricingPlan.find({
            isActive: true,
            $or: [{ validUntil: { $gte: new Date() } }, { validUntil: null }],
        })
            .sort({ priority: 1, finalPrice: 1 });
        res.status(200).json({
            success: true,
            message: "Active pricing plans retrieved successfully",
            data: pricingPlans,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching active pricing plans:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getActivePricingPlans = getActivePricingPlans;
// Get single pricing plan by ID
const getPricingPlanById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid pricing plan ID format",
            });
        }
        const pricingPlan = yield pricingPlan_model_1.PricingPlan.findById(id);
        if (!pricingPlan) {
            res.status(404).json({
                success: false,
                message: "Pricing plan not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Pricing plan retrieved successfully",
            data: pricingPlan,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching pricing plan:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getPricingPlanById = getPricingPlanById;
// Update pricing plan (Admin only)
const updatePricingPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid pricing plan ID format",
            });
        }
        // Check if plan exists
        const existingPlan = yield pricingPlan_model_1.PricingPlan.findById(id);
        if (!existingPlan) {
            res.status(404).json({
                success: false,
                message: "Pricing plan not found",
            });
        }
        // If name is being updated, check for duplicates
        if (updateData.name &&
            updateData.name.toLowerCase() !== (existingPlan === null || existingPlan === void 0 ? void 0 : existingPlan.name)) {
            const duplicatePlan = yield pricingPlan_model_1.PricingPlan.findOne({
                name: updateData.name.toLowerCase(),
                isActive: true,
                _id: { $ne: id },
            });
            if (duplicatePlan) {
                res.status(409).json({
                    success: false,
                    message: "Pricing plan with this name already exists",
                });
            }
        }
        // Calculate new final price if price or discount is updated
        if (updateData.price || updateData.discountPercentage !== undefined) {
            const price = updateData.price || (existingPlan === null || existingPlan === void 0 ? void 0 : existingPlan.price);
            const discount = updateData.discountPercentage !== undefined
                ? updateData.discountPercentage
                : existingPlan === null || existingPlan === void 0 ? void 0 : existingPlan.discountPercentage;
            updateData.finalPrice =
                discount > 0 ? price - (price * discount) / 100 : price;
        }
        // Convert name to lowercase if provided
        if (updateData.name) {
            updateData.name = updateData.name.toLowerCase();
        }
        const updatedPlan = yield pricingPlan_model_1.PricingPlan.findByIdAndUpdate(id, Object.assign(Object.assign({}, updateData), { updatedAt: new Date() }), { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: "Pricing plan updated successfully",
            data: updatedPlan,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error updating pricing plan:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updatePricingPlan = updatePricingPlan;
// Delete pricing plan (Admin only)
const deletePricingPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { permanent } = req.query;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid pricing plan ID format",
            });
        }
        const pricingPlan = yield pricingPlan_model_1.PricingPlan.findById(id);
        if (!pricingPlan) {
            res.status(404).json({
                success: false,
                message: "Pricing plan not found",
            });
        }
        // Check if plan is being used in any active purchases
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const activePurchases = yield purchase_model_1.Purchase.countDocuments({
            pricingPlan: id,
            status: { $in: ["completed", "pending"] },
        });
        if (activePurchases > 0 && permanent === "true") {
            res.status(400).json({
                success: false,
                message: "Cannot permanently delete pricing plan with active purchases. Deactivate instead.",
            });
            return;
        }
        if (permanent === "true") {
            // Permanent deletion
            yield pricingPlan_model_1.PricingPlan.findByIdAndDelete(id);
            res.status(200).json({
                success: true,
                message: "Pricing plan permanently deleted successfully",
            });
        }
        else {
            // Soft deletion (deactivate)
            const deactivatedPlan = yield pricingPlan_model_1.PricingPlan.findByIdAndUpdate(id, { isActive: false, updatedAt: new Date() }, { new: true });
            res.status(200).json({
                success: true,
                message: "Pricing plan deactivated successfully",
                data: deactivatedPlan,
            });
        }
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error deleting pricing plan:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.deletePricingPlan = deletePricingPlan;
// Get pricing plan analytics (Admin only)
const getPricingPlanAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { period = "monthly", startDate, endDate } = req.query;
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
        // Get purchase statistics for each pricing plan
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const planAnalytics = yield purchase_model_1.Purchase.aggregate([
            {
                $match: dateFilter,
            },
            {
                $group: {
                    _id: "$pricingPlan",
                    totalPurchases: { $sum: 1 },
                    totalRevenue: { $sum: "$amount" },
                    activePurchases: {
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                    },
                    pendingPurchases: {
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                    },
                },
            },
            {
                $lookup: {
                    from: "pricingplans",
                    localField: "_id",
                    foreignField: "_id",
                    as: "planDetails",
                },
            },
            {
                $unwind: "$planDetails",
            },
            {
                $project: {
                    planName: "$planDetails.name",
                    planPrice: "$planDetails.finalPrice",
                    totalPurchases: 1,
                    totalRevenue: 1,
                    activePurchases: 1,
                    pendingPurchases: 1,
                    conversionRate: {
                        $multiply: [
                            { $divide: ["$activePurchases", "$totalPurchases"] },
                            100,
                        ],
                    },
                },
            },
            {
                $sort: { totalRevenue: -1 },
            },
        ]);
        // Get overall statistics
        const totalPlans = yield pricingPlan_model_1.PricingPlan.countDocuments();
        const activePlans = yield pricingPlan_model_1.PricingPlan.countDocuments({ isActive: true });
        const totalPurchases = yield purchase_model_1.Purchase.countDocuments(dateFilter);
        const totalRevenue = yield purchase_model_1.Purchase.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        res.status(200).json({
            success: true,
            message: "Pricing plan analytics retrieved successfully",
            data: {
                overview: {
                    totalPlans,
                    activePlans,
                    inactivePlans: totalPlans - activePlans,
                    totalPurchases,
                    totalRevenue: ((_a = totalRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
                },
                planAnalytics,
                period,
                dateRange: {
                    startDate: ((_b = dateFilter.createdAt) === null || _b === void 0 ? void 0 : _b.$gte) || "All time",
                    endDate: ((_c = dateFilter.createdAt) === null || _c === void 0 ? void 0 : _c.$lte) || "Present",
                },
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching pricing plan analytics:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getPricingPlanAnalytics = getPricingPlanAnalytics;
