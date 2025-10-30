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
exports.getDownloadAnalytics = exports.getUserSubscriptionStatus = exports.getUserDownloads = exports.downloadDesignFile = exports.getAllDownloads = void 0;
const mongoose_1 = require("mongoose");
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const url_1 = require("url");
const download_model_1 = require("./download.model");
const purchase_model_1 = require("../purchase/purchase.model");
const design_model_1 = require("../design/design.model");
const user_model_1 = require("../user/user.model");
// Get all downloads (Admin only) - with advanced filters
const getAllDownloads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, sortBy = "downloadDate", sortOrder = "desc", downloadType, userId, designId, search, startDate, endDate, } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Build filter object
        const filter = {};
        // Filter by download type
        if (downloadType) {
            filter.downloadType = downloadType;
        }
        // Filter by user ID
        if (userId && mongoose_1.Types.ObjectId.isValid(userId)) {
            filter.user = new mongoose_1.Types.ObjectId(userId);
        }
        // Filter by design ID
        if (designId && mongoose_1.Types.ObjectId.isValid(designId)) {
            filter.design = new mongoose_1.Types.ObjectId(designId);
        }
        // Filter by date range
        if (startDate || endDate) {
            filter.downloadDate = {};
            if (startDate) {
                filter.downloadDate.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.downloadDate.$lte = new Date(endDate);
            }
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        // If search is provided, we need to search in populated fields
        if (search) {
            // First, find matching users or designs
            const userIds = yield user_model_1.User.find({
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            })
                .distinct("_id")
                .exec();
            const designIds = yield design_model_1.Design.find({
                $or: [
                    { title: { $regex: search, $options: "i" } },
                    { designerName: { $regex: search, $options: "i" } },
                ],
            })
                .distinct("_id")
                .exec();
            // Add search filter
            filter.$or = [{ user: { $in: userIds } }, { design: { $in: designIds } }];
        }
        // Execute query with population
        const downloads = yield download_model_1.Download.find(filter)
            .populate("user", "name email profileImage role")
            .populate("design", "title previewImageUrl price designerName category")
            .populate("purchase", "purchaseType amount transactionId")
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .select("-__v");
        const totalDownloads = yield download_model_1.Download.countDocuments(filter);
        const totalPages = Math.ceil(totalDownloads / limitNum);
        // Calculate statistics
        const stats = yield download_model_1.Download.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalDownloads: { $sum: 1 },
                    individualPurchases: {
                        $sum: {
                            $cond: [{ $eq: ["$downloadType", "individual_purchase"] }, 1, 0],
                        },
                    },
                    subscriptionDownloads: {
                        $sum: { $cond: [{ $eq: ["$downloadType", "subscription"] }, 1, 0] },
                    },
                    uniqueUsers: { $addToSet: "$user" },
                    uniqueDesigns: { $addToSet: "$design" },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalDownloads: 1,
                    individualPurchases: 1,
                    subscriptionDownloads: 1,
                    uniqueUsers: { $size: "$uniqueUsers" },
                    uniqueDesigns: { $size: "$uniqueDesigns" },
                },
            },
        ]);
        res.status(200).json({
            success: true,
            message: "All downloads retrieved successfully",
            data: downloads,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: totalDownloads,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
            statistics: stats[0] || {
                totalDownloads: 0,
                individualPurchases: 0,
                subscriptionDownloads: 0,
                uniqueUsers: 0,
                uniqueDesigns: 0,
            },
            filters: {
                downloadType: downloadType || null,
                userId: userId || null,
                designId: designId || null,
                search: search || null,
                dateRange: {
                    startDate: startDate || null,
                    endDate: endDate || null,
                },
                sortBy,
                sortOrder,
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching all downloads:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getAllDownloads = getAllDownloads;
// Stream/download the design's downloadable file via server as attachment
const downloadDesignFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
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
        const design = yield design_model_1.Design.findById(designId).lean();
        if (!design || design.status !== "Active") {
            res.status(404).json({
                success: false,
                message: "Design not found or not available",
            });
            return;
        }
        // Check if user has permission to download this design
        const permission = yield checkDownloadPermission(userId.toString(), designId);
        if (!permission.allowed) {
            res.status(403).json({
                success: false,
                message: permission.reason,
            });
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const designAny = design;
        const downloadable = designAny.downloadableFile;
        if (!downloadable || !downloadable.secure_url) {
            res.status(404).json({
                success: false,
                message: "No downloadable file associated with this design",
            });
            return;
        }
        const fileFormat = String((_b = downloadable.file_format) !== null && _b !== void 0 ? _b : "bin");
        const titleSafe = designAny.title
            ? String(designAny.title).replace(/[^a-z0-9_.-]/gi, "_")
            : "download";
        const filename = `${titleSafe}.${fileFormat}`.replace(/\.+$/, "");
        const secureUrl = String((_c = downloadable.secure_url) !== null && _c !== void 0 ? _c : "");
        // Record the download
        const download = new download_model_1.Download({
            user: userId,
            design: designId,
            downloadType: permission.downloadType,
            purchase: permission.purchaseId,
            downloadDate: new Date(),
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
        });
        yield download.save();
        // Increment the design download count
        yield design_model_1.Design.findByIdAndUpdate(designId, { $inc: { downloadCount: 1 } }, { new: true });
        // Update remaining downloads for subscription purchases
        if (permission.downloadType === "subscription" && permission.purchaseId) {
            yield purchase_model_1.Purchase.findByIdAndUpdate(permission.purchaseId, { $inc: { remainingDownloads: -1 } }, { new: true });
        }
        // Always stream the file from Cloudinary to the client
        if (secureUrl) {
            const parsed = new url_1.URL(secureUrl);
            const client = parsed.protocol === "https:" ? https_1.default : http_1.default;
            client
                .get(secureUrl, (cloudRes) => {
                var _a;
                const status = (_a = cloudRes.statusCode) !== null && _a !== void 0 ? _a : 0;
                if (status >= 400) {
                    const chunks = [];
                    cloudRes.on("data", (c) => chunks.push(Buffer.from(c)));
                    cloudRes.on("end", () => {
                        const body = Buffer.concat(chunks).toString("utf8");
                        // eslint-disable-next-line no-console
                        console.error("Upstream fetch failed", {
                            status,
                            headers: cloudRes.headers,
                            body: body.slice(0, 2000),
                        });
                        if (!res.headersSent) {
                            res.status(502).json({
                                success: false,
                                message: `Upstream error when fetching file: ${status}`,
                                upstream: {
                                    status,
                                    headers: cloudRes.headers,
                                    body: body.slice(0, 2000),
                                },
                            });
                        }
                    });
                    return;
                }
                res.setHeader("Content-Type", cloudRes.headers["content-type"] || "application/octet-stream");
                if (cloudRes.headers["content-length"])
                    res.setHeader("Content-Length", cloudRes.headers["content-length"]);
                res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
                cloudRes.pipe(res);
            })
                .on("error", (err) => {
                // eslint-disable-next-line no-console
                console.error("Error fetching file from Cloudinary:", err);
                if (!res.headersSent)
                    res
                        .status(502)
                        .json({ success: false, message: "Failed to fetch file" });
            });
            return;
        }
        res
            .status(404)
            .json({ success: false, message: "No downloadable URL available" });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Download endpoint error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown";
        res.status(500).json({
            success: false,
            message: "Failed to download file",
            error: errorMessage,
        });
    }
});
exports.downloadDesignFile = downloadDesignFile;
// Check download permission
const checkDownloadPermission = (userId, designId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Check if user has purchased this design individually
    const individualPurchase = yield purchase_model_1.Purchase.findOne({
        user: userId,
        design: designId,
        purchaseType: "individual",
        status: "completed",
    });
    if (individualPurchase) {
        return {
            allowed: true,
            downloadType: "individual_purchase",
            purchaseId: (_a = individualPurchase._id) === null || _a === void 0 ? void 0 : _a.toString(),
        };
    }
    // Check if user has an active subscription with remaining downloads
    const activeSubscription = yield purchase_model_1.Purchase.findOne({
        user: userId,
        purchaseType: "subscription",
        status: "completed",
        subscriptionEndDate: { $gt: new Date() },
        remainingDownloads: { $gt: 0 },
    });
    if (activeSubscription) {
        return {
            allowed: true,
            downloadType: "subscription",
            purchaseId: (_b = activeSubscription._id) === null || _b === void 0 ? void 0 : _b.toString(),
        };
    }
    // Check if subscription exists but has no downloads left
    const subscriptionNoDownloads = yield purchase_model_1.Purchase.findOne({
        user: userId,
        purchaseType: "subscription",
        status: "active",
        subscriptionEndDate: { $gt: new Date() },
        remainingDownloads: { $lte: 0 },
    });
    if (subscriptionNoDownloads) {
        return {
            allowed: false,
            reason: "You have reached your download limit for this subscription period",
        };
    }
    // Check if subscription has expired
    const expiredSubscription = yield purchase_model_1.Purchase.findOne({
        user: userId,
        purchaseType: "subscription",
        status: "active",
        subscriptionEndDate: { $lte: new Date() },
    });
    if (expiredSubscription) {
        return {
            allowed: false,
            reason: "Your subscription has expired. Please renew to continue downloading",
        };
    }
    return {
        allowed: false,
        reason: "You need to purchase this design individually or have an active subscription to download it",
    };
});
// Get user's download history
const getUserDownloads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { page = 1, limit = 10, sortBy = "downloadDate", sortOrder = "desc", downloadType, } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const filter = { user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id };
        if (downloadType) {
            filter.downloadType = downloadType;
        }
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        const downloads = yield download_model_1.Download.find(filter)
            .populate("design", "title previewImageUrl price designerName")
            .populate("purchase", "purchaseType amount")
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .select("-__v -ipAddress -userAgent");
        const totalDownloads = yield download_model_1.Download.countDocuments(filter);
        const totalPages = Math.ceil(totalDownloads / limitNum);
        res.status(200).json({
            success: true,
            message: "Download history retrieved successfully",
            data: downloads,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: totalDownloads,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching download history:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getUserDownloads = getUserDownloads;
// Get user's subscription status
const getUserSubscriptionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        const activeSubscription = yield purchase_model_1.Purchase.findOne({
            user: userId,
            purchaseType: "subscription",
            status: "completed",
            subscriptionEndDate: { $gt: new Date() },
        })
            .populate("pricingPlan", "name description features maxDownloads duration")
            .select("-paymentDetails -__v");
        if (!activeSubscription) {
            res.status(200).json({
                success: true,
                message: "No active subscription found",
                data: {
                    hasActiveSubscription: false,
                    subscription: null,
                },
            });
            return;
        }
        // Get download count for current subscription period
        const downloadCount = yield download_model_1.Download.countDocuments({
            user: userId,
            purchase: activeSubscription._id,
            downloadType: "subscription",
        });
        res.status(200).json({
            success: true,
            message: "Subscription status retrieved successfully",
            data: {
                hasActiveSubscription: true,
                subscription: activeSubscription,
                downloadStats: {
                    totalDownloaded: downloadCount,
                    remainingDownloads: activeSubscription.remainingDownloads,
                    downloadLimitReached: (activeSubscription.remainingDownloads || 0) <= 0,
                },
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching subscription status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getUserSubscriptionStatus = getUserSubscriptionStatus;
// Get download analytics (Admin only)
const getDownloadAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { period = "monthly", startDate, endDate } = req.query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let dateFilter = {};
        const now = new Date();
        if (startDate && endDate) {
            dateFilter = {
                downloadDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            };
        }
        else {
            // Default period-based filtering
            switch (period) {
                case "daily":
                    dateFilter.downloadDate = {
                        $gte: new Date(now.setDate(now.getDate() - 1)),
                    };
                    break;
                case "weekly":
                    dateFilter.downloadDate = {
                        $gte: new Date(now.setDate(now.getDate() - 7)),
                    };
                    break;
                case "monthly":
                    dateFilter.downloadDate = {
                        $gte: new Date(now.setMonth(now.getMonth() - 1)),
                    };
                    break;
                case "yearly":
                    dateFilter.downloadDate = {
                        $gte: new Date(now.setFullYear(now.getFullYear() - 1)),
                    };
                    break;
            }
        }
        // Get overall download statistics
        const overallStats = yield download_model_1.Download.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalDownloads: { $sum: 1 },
                    individualDownloads: {
                        $sum: {
                            $cond: [{ $eq: ["$downloadType", "individual_purchase"] }, 1, 0],
                        },
                    },
                    subscriptionDownloads: {
                        $sum: { $cond: [{ $eq: ["$downloadType", "subscription"] }, 1, 0] },
                    },
                    uniqueUsers: { $addToSet: "$user" },
                    uniqueDesigns: { $addToSet: "$design" },
                },
            },
            {
                $project: {
                    totalDownloads: 1,
                    individualDownloads: 1,
                    subscriptionDownloads: 1,
                    uniqueUsers: { $size: "$uniqueUsers" },
                    uniqueDesigns: { $size: "$uniqueDesigns" },
                },
            },
        ]);
        // Get top downloaded designs
        const topDesigns = yield download_model_1.Download.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: "$design",
                    downloadCount: { $sum: 1 },
                },
            },
            { $sort: { downloadCount: -1 } },
            { $limit: 10 },
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
                    designId: "$_id",
                    designTitle: "$designDetails.title",
                    designPrice: "$designDetails.price",
                    downloadCount: 1,
                },
            },
        ]);
        res.status(200).json({
            success: true,
            message: "Download analytics retrieved successfully",
            data: {
                overview: overallStats[0] || {
                    totalDownloads: 0,
                    individualDownloads: 0,
                    subscriptionDownloads: 0,
                    uniqueUsers: 0,
                    uniqueDesigns: 0,
                },
                topDesigns,
                period,
                dateRange: {
                    startDate: ((_a = dateFilter.downloadDate) === null || _a === void 0 ? void 0 : _a.$gte) || "All time",
                    endDate: ((_b = dateFilter.downloadDate) === null || _b === void 0 ? void 0 : _b.$lte) || "Present",
                },
            },
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching download analytics:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getDownloadAnalytics = getDownloadAnalytics;
