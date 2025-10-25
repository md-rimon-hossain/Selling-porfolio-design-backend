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
exports.getPurchaseAnalytics = exports.checkSubscriptionEligibility = exports.cancelPurchase = exports.updatePurchaseStatus = exports.getPurchaseById = exports.getUserPurchases = exports.getAllPurchases = exports.createPurchase = void 0;
const mongoose_1 = require("mongoose");
const purchase_model_1 = require("./purchase.model");
const pricingPlan_model_1 = require("../pricingPlan/pricingPlan.model");
const design_model_1 = require("../design/design.model");
// Create a new purchase
const createPurchase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { purchaseType, design, pricingPlan, paymentMethod, paymentDetails, currency, billingAddress, notes, } = req.body;
        let amount = 0;
        let subscriptionStartDate;
        let subscriptionEndDate;
        let remainingDownloads;
        if (purchaseType === "individual") {
            // Individual design purchase
            const designDoc = yield design_model_1.Design.findById(design);
            if (!designDoc || designDoc.status !== "Active") {
                res.status(404).json({
                    success: false,
                    message: "Design not found or not available",
                });
                return;
            }
            amount = designDoc.price;
        }
        else if (purchaseType === "subscription") {
            // Subscription purchase
            const plan = yield pricingPlan_model_1.PricingPlan.findById(pricingPlan);
            if (!plan || !plan.isActive) {
                res.status(404).json({
                    success: false,
                    message: "Pricing plan not found or inactive",
                });
                return;
            }
            // Check if plan is still valid (if has validUntil date)
            if (plan.validUntil && new Date() > plan.validUntil) {
                res.status(400).json({
                    success: false,
                    message: "Pricing plan has expired",
                });
                return;
            }
            amount = plan.finalPrice || plan.price;
            // Set subscription dates
            subscriptionStartDate = new Date();
            const duration = plan.duration.toLowerCase();
            subscriptionEndDate = new Date(subscriptionStartDate);
            if (duration.includes("month")) {
                const months = parseInt(((_a = duration.match(/\d+/)) === null || _a === void 0 ? void 0 : _a[0]) || "1");
                subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + months);
            }
            else if (duration.includes("year")) {
                const years = parseInt(((_b = duration.match(/\d+/)) === null || _b === void 0 ? void 0 : _b[0]) || "1");
                subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + years);
            }
            else {
                // Default to 1 month if duration format is unclear
                subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
            }
            remainingDownloads = plan.maxDownloads || 999999; // Unlimited if not specified
        }
        else {
            res.status(400).json({
                success: false,
                message: "Invalid purchase type. Must be 'individual' or 'subscription'",
            });
            return;
        }
        if (!((_c = req.user) === null || _c === void 0 ? void 0 : _c._id)) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        // Check for existing purchases based on type
        if (purchaseType === "individual") {
            // Check if user already purchased this design
            const existingDesignPurchase = yield purchase_model_1.Purchase.findOne({
                user: req.user._id,
                design,
                purchaseType: "individual",
                status: { $in: ["completed", "pending"] },
            });
            if (existingDesignPurchase) {
                res.status(409).json({
                    success: false,
                    message: `You have already ${existingDesignPurchase.status} purchased this design`,
                });
                return;
            }
        }
        else if (purchaseType === "subscription") {
            // Check if user has an active subscription
            const activeSubscription = yield purchase_model_1.Purchase.findOne({
                user: req.user._id,
                purchaseType: "subscription",
                status: "completed",
                subscriptionEndDate: { $gt: new Date() },
            }).populate("pricingPlan", "name duration");
            if (activeSubscription) {
                const daysRemaining = Math.ceil((activeSubscription.subscriptionEndDate.getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24));
                res.status(409).json({
                    success: false,
                    message: "You already have an active subscription",
                    error: "DUPLICATE_SUBSCRIPTION",
                    data: {
                        currentSubscription: {
                            id: activeSubscription._id,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            planName: ((_d = activeSubscription.pricingPlan) === null || _d === void 0 ? void 0 : _d.name) || "Unknown Plan",
                            remainingDays: daysRemaining,
                            expiryDate: activeSubscription.subscriptionEndDate,
                            remainingDownloads: activeSubscription.remainingDownloads || 0,
                        },
                        suggestions: [
                            "Wait for current subscription to expire",
                            "Upgrade your current plan (if available)",
                            "Contact support for plan changes",
                        ],
                    },
                });
                return;
            }
            // Check for pending subscription
            const pendingSubscription = yield purchase_model_1.Purchase.findOne({
                user: req.user._id,
                purchaseType: "subscription",
                status: "pending",
            }).populate("pricingPlan", "name price");
            if (pendingSubscription) {
                res.status(409).json({
                    success: false,
                    message: "You have a pending subscription payment",
                    error: "PENDING_SUBSCRIPTION",
                    data: {
                        pendingPurchase: {
                            id: pendingSubscription._id,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            planName: ((_e = pendingSubscription.pricingPlan) === null || _e === void 0 ? void 0 : _e.name) ||
                                "Unknown Plan",
                            amount: pendingSubscription.amount,
                            createdAt: pendingSubscription.createdAt,
                        },
                        action: "Complete the pending payment or cancel it first",
                    },
                });
                return;
            }
        }
        const newPurchase = new purchase_model_1.Purchase({
            user: req.user._id,
            purchaseType,
            design: purchaseType === "individual" ? design : undefined,
            pricingPlan: purchaseType === "subscription" ? pricingPlan : undefined,
            amount,
            currency: currency || "USD",
            paymentMethod,
            paymentDetails,
            billingAddress,
            subscriptionStartDate,
            subscriptionEndDate,
            remainingDownloads,
            notes,
            status: paymentMethod === "free" ? "completed" : "pending",
            purchaseDate: new Date(),
        });
        const savedPurchase = yield newPurchase.save();
        // Populate the purchase with relevant details
        let populateField = "";
        let selectFields = "";
        if (purchaseType === "individual") {
            populateField = "design";
            selectFields = "title price images";
        }
        else {
            populateField = "pricingPlan";
            selectFields = "name description features duration maxDownloads";
        }
        const populatedPurchase = yield purchase_model_1.Purchase.findById(savedPurchase._id)
            .populate(populateField, selectFields)
            .populate("user", "name email")
            .select("-__v");
        res.status(201).json({
            success: true,
            message: "Purchase created successfully",
            data: populatedPurchase,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error creating purchase:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.createPurchase = createPurchase;
// Get all purchases (Admin only)
const getAllPurchases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", status, paymentMethod, purchaseType, minAmount, maxAmount, startDate, endDate, search, } = req.query;
        console.log(req.query);
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Build filter object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        }
        if (purchaseType) {
            filter.purchaseType = purchaseType;
        }
        if (minAmount) {
            filter.amount = Object.assign(Object.assign({}, filter.amount), { $gte: parseFloat(minAmount) });
        }
        if (maxAmount) {
            filter.amount = Object.assign(Object.assign({}, filter.amount), { $lte: parseFloat(maxAmount) });
        }
        if (startDate || endDate) {
            filter.purchaseDate = {};
            if (startDate) {
                filter.purchaseDate.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.purchaseDate.$lte = new Date(endDate);
            }
        }
        if (search) {
            filter.$or = [
                { "user.name": { $regex: search, $options: "i" } },
                { "user.email": { $regex: search, $options: "i" } },
                { notes: { $regex: search, $options: "i" } },
            ];
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        const purchases = yield purchase_model_1.Purchase.find(filter)
            .populate("user", "name email")
            .populate("design", "title price")
            .populate("pricingPlan", "name description price finalPrice duration")
            .sort(sort)
            .skip(skip)
            .limit(limitNum);
        const totalPurchases = yield purchase_model_1.Purchase.countDocuments(filter);
        const totalPages = Math.ceil(totalPurchases / limitNum);
        res.status(200).json({
            success: true,
            message: "Purchases retrieved successfully",
            data: purchases,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: totalPurchases,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching purchases:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getAllPurchases = getAllPurchases;
// Get user's own purchases
const getUserPurchases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { page = 1, limit = 10, sortBy = "purchaseDate", sortOrder = "desc", status, purchaseType, } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Build filter object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter = { user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id };
        if (status) {
            filter.status = status;
        }
        if (purchaseType) {
            filter.purchaseType = purchaseType;
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        const purchases = yield purchase_model_1.Purchase.find(filter)
            .populate("pricingPlan", "name description features duration price finalPrice")
            .populate("design", "title price images")
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .select("-__v -paymentDetails");
        const totalPurchases = yield purchase_model_1.Purchase.countDocuments(filter);
        const totalPages = Math.ceil(totalPurchases / limitNum);
        res.status(200).json({
            success: true,
            message: "Your purchases retrieved successfully",
            data: purchases,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: totalPurchases,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching user purchases:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getUserPurchases = getUserPurchases;
// Get single purchase by ID
const getPurchaseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid purchase ID format",
            });
        }
        const purchase = yield purchase_model_1.Purchase.findById(id)
            .populate("user", "name email")
            .populate("pricingPlan", "name description features duration price finalPrice")
            .select("-__v");
        if (!purchase) {
            res.status(404).json({
                success: false,
                message: "Purchase not found",
            });
            return;
        }
        // Check if user is authorized to view this purchase
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin" &&
            ((_b = purchase.user) === null || _b === void 0 ? void 0 : _b._id.toString()) !== ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString())) {
            res.status(403).json({
                success: false,
                message: "Not authorized to view this purchase",
            });
            return;
        }
        // Hide payment details for non-admin users
        if (((_e = req.user) === null || _e === void 0 ? void 0 : _e.role) !== "admin") {
            purchase.paymentDetails = undefined;
        }
        res.status(200).json({
            success: true,
            message: "Purchase retrieved successfully",
            data: purchase,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching purchase:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getPurchaseById = getPurchaseById;
// Update purchase status (Admin only)
const updatePurchaseStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid purchase ID format",
            });
        }
        const purchase = yield purchase_model_1.Purchase.findById(id);
        if (!purchase) {
            res.status(404).json({
                success: false,
                message: "Purchase not found",
            });
            return;
        }
        // Update purchase status and add admin notes
        const updateData = {
            status,
            updatedAt: new Date(),
        };
        if (adminNotes) {
            updateData.adminNotes = adminNotes;
        }
        // Set activation date if status is being changed to active
        if (status === "completed" && purchase.status !== "completed") {
            updateData.activatedAt = new Date();
            // For subscription purchases, set subscription dates and download limits
            if (purchase.purchaseType === "subscription" && purchase.pricingPlan) {
                const plan = yield pricingPlan_model_1.PricingPlan.findById(purchase.pricingPlan);
                if (plan) {
                    const subscriptionStartDate = new Date();
                    const subscriptionEndDate = new Date(subscriptionStartDate);
                    const duration = plan.duration.toLowerCase();
                    if (duration.includes("month")) {
                        const months = parseInt(((_a = duration.match(/\\d+/)) === null || _a === void 0 ? void 0 : _a[0]) || "1");
                        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + months);
                    }
                    else if (duration.includes("year")) {
                        const years = parseInt(((_b = duration.match(/\\d+/)) === null || _b === void 0 ? void 0 : _b[0]) || "1");
                        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + years);
                    }
                    else {
                        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
                    }
                    updateData.subscriptionStartDate = subscriptionStartDate;
                    updateData.subscriptionEndDate = subscriptionEndDate;
                    updateData.remainingDownloads = plan.maxDownloads || 999999;
                }
            }
        }
        // Set expiry date if status is being changed to expired
        if (status === "expired" && purchase.status !== "expired") {
            updateData.expiredAt = new Date();
        }
        const updatedPurchase = yield purchase_model_1.Purchase.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate("user", "name email")
            .populate("pricingPlan", "name description features duration")
            .select("-__v");
        res.status(200).json({
            success: true,
            message: "Purchase status updated successfully",
            data: updatedPurchase,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error updating purchase status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updatePurchaseStatus = updatePurchaseStatus;
// Cancel purchase (User can cancel their own pending purchases)
const cancelPurchase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const { cancelReason } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid purchase ID format",
            });
        }
        const purchase = yield purchase_model_1.Purchase.findById(id);
        if (!purchase) {
            res.status(404).json({
                success: false,
                message: "Purchase not found",
            });
            return;
        }
        // Check if user is authorized to cancel this purchase
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin" &&
            ((_b = purchase.user) === null || _b === void 0 ? void 0 : _b.toString()) !== ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString())) {
            res.status(403).json({
                success: false,
                message: "Not authorized to cancel this purchase",
            });
            return;
        }
        // Check if purchase can be cancelled
        if (purchase.status !== "pending") {
            res.status(400).json({
                success: false,
                message: "Only pending purchases can be cancelled",
            });
        }
        const cancelledPurchase = yield purchase_model_1.Purchase.findByIdAndUpdate(id, {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelReason: cancelReason || "Cancelled by user",
            updatedAt: new Date(),
        }, { new: true })
            .populate("pricingPlan", "name description")
            .select("-__v -paymentDetails");
        res.status(200).json({
            success: true,
            message: "Purchase cancelled successfully",
            data: cancelledPurchase,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error cancelling purchase:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.cancelPurchase = cancelPurchase;
// Check subscription eligibility (prevent duplicate subscriptions)
const checkSubscriptionEligibility = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        // Check for active subscription
        const activeSubscription = yield purchase_model_1.Purchase.findOne({
            user: userId,
            purchaseType: "subscription",
            status: "active",
            subscriptionEndDate: { $gt: new Date() },
        }).populate("pricingPlan", "name duration price maxDownloads");
        // Check for pending subscription
        const pendingSubscription = yield purchase_model_1.Purchase.findOne({
            user: userId,
            purchaseType: "subscription",
            status: "pending",
        }).populate("pricingPlan", "name price");
        const canPurchaseSubscription = !activeSubscription && !pendingSubscription;
        res.status(200).json({
            success: true,
            message: "Subscription eligibility checked",
            data: {
                canPurchaseSubscription,
                hasActiveSubscription: !!activeSubscription,
                hasPendingSubscription: !!pendingSubscription,
                activeSubscription: activeSubscription
                    ? {
                        id: activeSubscription._id,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        planName: ((_b = activeSubscription.pricingPlan) === null || _b === void 0 ? void 0 : _b.name) || "Unknown Plan",
                        expiryDate: activeSubscription.subscriptionEndDate,
                        remainingDownloads: activeSubscription.remainingDownloads || 0,
                        daysRemaining: Math.ceil((activeSubscription.subscriptionEndDate.getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24)),
                    }
                    : null,
                pendingSubscription: pendingSubscription
                    ? {
                        id: pendingSubscription._id,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        planName: ((_c = pendingSubscription.pricingPlan) === null || _c === void 0 ? void 0 : _c.name) ||
                            "Unknown Plan",
                        amount: pendingSubscription.amount,
                        createdAt: pendingSubscription.createdAt,
                    }
                    : null,
                message: canPurchaseSubscription
                    ? "You can purchase a subscription"
                    : "You already have a subscription (active or pending)",
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error checking subscription eligibility:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.checkSubscriptionEligibility = checkSubscriptionEligibility;
// Get purchase analytics (Admin only)
const getPurchaseAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { period = "monthly", startDate, endDate } = req.query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let dateFilter = {};
        const now = new Date();
        if (startDate && endDate) {
            dateFilter = {
                purchaseDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            };
        }
        else {
            // Default period-based filtering
            switch (period) {
                case "daily":
                    dateFilter.purchaseDate = {
                        $gte: new Date(now.setDate(now.getDate() - 1)),
                    };
                    break;
                case "weekly":
                    dateFilter.purchaseDate = {
                        $gte: new Date(now.setDate(now.getDate() - 7)),
                    };
                    break;
                case "monthly":
                    dateFilter.purchaseDate = {
                        $gte: new Date(now.setMonth(now.getMonth() - 1)),
                    };
                    break;
                case "yearly":
                    dateFilter.purchaseDate = {
                        $gte: new Date(now.setFullYear(now.getFullYear() - 1)),
                    };
                    break;
            }
        }
        // Get overall purchase statistics
        const overallStats = yield purchase_model_1.Purchase.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalPurchases: { $sum: 1 },
                    totalRevenue: { $sum: "$amount" },
                    activePurchases: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                    },
                    pendingPurchases: {
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                    },
                    cancelledPurchases: {
                        $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
                    },
                    averageOrderValue: { $avg: "$amount" },
                },
            },
        ]);
        // Get purchase statistics by status
        const statusStats = yield purchase_model_1.Purchase.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);
        // Get purchase statistics by payment method
        const paymentMethodStats = yield purchase_model_1.Purchase.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: "$paymentMethod",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);
        // Get purchase statistics by pricing plan
        const planStats = yield purchase_model_1.Purchase.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: "$pricingPlan",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
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
                    count: 1,
                    totalAmount: 1,
                },
            },
            { $sort: { totalAmount: -1 } },
        ]);
        res.status(200).json({
            success: true,
            message: "Purchase analytics retrieved successfully",
            data: {
                overview: overallStats[0] || {
                    totalPurchases: 0,
                    totalRevenue: 0,
                    activePurchases: 0,
                    pendingPurchases: 0,
                    cancelledPurchases: 0,
                    averageOrderValue: 0,
                },
                statusBreakdown: statusStats,
                paymentMethodBreakdown: paymentMethodStats,
                planBreakdown: planStats,
                period,
                dateRange: {
                    startDate: ((_a = dateFilter.purchaseDate) === null || _a === void 0 ? void 0 : _a.$gte) || "All time",
                    endDate: ((_b = dateFilter.purchaseDate) === null || _b === void 0 ? void 0 : _b.$lte) || "Present",
                },
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching purchase analytics:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getPurchaseAnalytics = getPurchaseAnalytics;
