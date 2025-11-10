"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.PaymentController = void 0;
const mongoose_1 = require("mongoose");
const payment_validation_1 = require("./payment.validation");
const payment_services_1 = require("./payment.services");
/**
 * Create a new payment intent for any product type
 * Supports: designs, courses, subscriptions
 */
const createPaymentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Validate request body
        const parseResult = payment_validation_1.createPaymentSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.errors,
            });
            return;
        }
        const { productType, productId, currency } = parseResult.data;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        // Create payment intent
        const result = yield payment_services_1.PaymentServiceInstance.createPaymentIntentService(userId.toString(), productType, productId, currency);
        res.status(200).json({
            success: true,
            message: "Payment intent created successfully",
            data: {
                clientSecret: result.clientSecret,
                paymentIntentId: result.paymentIntentId,
            },
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error creating payment:", err);
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Failed to create payment",
        });
    }
});
/**
 * Get payment status by payment intent ID
 * Returns payment details including linked purchase if completed
 */
const getPaymentStatusController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { paymentIntentId } = req.params;
        if (!paymentIntentId) {
            res.status(400).json({
                success: false,
                message: "Payment intent ID is required",
            });
            return;
        }
        const payment = yield payment_services_1.PaymentServiceInstance.getPaymentStatusService(paymentIntentId);
        // Check if user is authorized to view this payment
        // userId is populated, so we need to access _id if it's an object
        const paymentUserId = typeof payment.userId === "object" && payment.userId !== null
            ? payment.userId._id.toString()
            : payment.userId.toString();
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin" &&
            paymentUserId !== ((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString())) {
            res.status(403).json({
                success: false,
                message: "Not authorized to view this payment",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Payment status retrieved successfully",
            data: payment,
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error getting payment status:", err);
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Failed to get payment status",
        });
    }
});
/**
 * Refund a payment (Admin only)
 * Creates refund on Stripe and updates Purchase record
 */
const refundPaymentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Check admin authorization
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
            res.status(403).json({
                success: false,
                message: "Only admins can process refunds",
            });
            return;
        }
        // Validate request body
        const parseResult = payment_validation_1.refundPaymentSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.errors,
            });
            return;
        }
        const { paymentIntentId, amount, reason } = parseResult.data;
        // Process refund
        const result = yield payment_services_1.PaymentServiceInstance.refundPaymentService(paymentIntentId, amount, reason);
        res.status(200).json({
            success: true,
            message: "Refund processed successfully",
            data: {
                status: result.status,
                refundId: result.refundId,
            },
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error processing refund:", err);
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Failed to process refund",
        });
    }
});
/**
 * Get user's payment history
 */
const getUserPaymentsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { Payment } = yield Promise.resolve().then(() => __importStar(require("./payment.model")));
        const payments = yield Payment.find({ userId })
            .populate("designId", "title basePrice previewImageUrls")
            .populate("courseId", "title basePrice thumbnailImageUrl")
            .populate("pricingPlanId", "name price duration")
            .populate("purchaseId")
            .sort({ createdAt: -1 })
            .limit(50)
            .select("-__v");
        res.status(200).json({
            success: true,
            message: "Payment history retrieved successfully",
            data: payments,
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error getting payment history:", err);
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Failed to get payment history",
        });
    }
});
/**
 * Get all payments with filters (Admin only)
 * Supports pagination, filtering by status, user, product type, date range
 */
const getAllPaymentsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 20, status, productType, userId, startDate, endDate, sortBy = "createdAt", sortOrder = "desc", } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Build filter object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (productType) {
            filter.productType = productType;
        }
        if (userId && mongoose_1.Types.ObjectId.isValid(userId)) {
            filter.userId = new mongoose_1.Types.ObjectId(userId);
        }
        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        const { Payment } = yield Promise.resolve().then(() => __importStar(require("./payment.model")));
        // Get payments with populated data
        const payments = yield Payment.find(filter)
            .populate("userId", "name email profileImage role")
            .populate("designId", "title basePrice previewImageUrls")
            .populate("courseId", "title basePrice thumbnailImageUrl")
            .populate("pricingPlanId", "name price duration")
            .populate("purchaseId")
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .select("-__v");
        const totalPayments = yield Payment.countDocuments(filter);
        const totalPages = Math.ceil(totalPayments / limitNum);
        res.status(200).json({
            success: true,
            message: "All payments retrieved successfully",
            data: payments,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: totalPayments,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error getting all payments:", err);
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Failed to get payments",
        });
    }
});
/**
 * Get payment statistics (Admin only)
 * Returns counts by status, revenue, product type breakdown
 */
const getPaymentStatisticsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        // Build date filter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                dateFilter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.createdAt.$lte = new Date(endDate);
            }
        }
        const { Payment } = yield Promise.resolve().then(() => __importStar(require("./payment.model")));
        // Get payment statistics
        const statistics = yield Payment.aggregate([
            { $match: dateFilter },
            {
                $facet: {
                    // Count by status
                    statusCounts: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 },
                                totalAmount: { $sum: "$amount" },
                            },
                        },
                    ],
                    // Count by product type
                    productTypeCounts: [
                        {
                            $group: {
                                _id: "$productType",
                                count: { $sum: 1 },
                                totalAmount: { $sum: "$amount" },
                            },
                        },
                    ],
                    // Overall stats
                    overallStats: [
                        {
                            $group: {
                                _id: null,
                                totalPayments: { $sum: 1 },
                                totalRevenue: {
                                    $sum: {
                                        $cond: [{ $eq: ["$status", "succeeded"] }, "$amount", 0],
                                    },
                                },
                                averageAmount: { $avg: "$amount" },
                                successfulPayments: {
                                    $sum: { $cond: [{ $eq: ["$status", "succeeded"] }, 1, 0] },
                                },
                                failedPayments: {
                                    $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
                                },
                                pendingPayments: {
                                    $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                                },
                                canceledPayments: {
                                    $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] },
                                },
                                refundedPayments: {
                                    $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] },
                                },
                            },
                        },
                    ],
                    // Recent payments
                    recentPayments: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 10 },
                        {
                            $lookup: {
                                from: "users",
                                localField: "userId",
                                foreignField: "_id",
                                as: "user",
                            },
                        },
                        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                _id: 1,
                                amount: 1,
                                currency: 1,
                                status: 1,
                                productType: 1,
                                createdAt: 1,
                                userName: "$user.name",
                                userEmail: "$user.email",
                            },
                        },
                    ],
                },
            },
        ]);
        const result = statistics[0];
        // Format status counts
        const statusBreakdown = {};
        result.statusCounts.forEach((item) => {
            statusBreakdown[item._id] = {
                count: item.count,
                amount: item.totalAmount,
            };
        });
        // Format product type counts
        const productTypeBreakdown = {};
        result.productTypeCounts.forEach((item) => {
            productTypeBreakdown[item._id] = {
                count: item.count,
                amount: item.totalAmount,
            };
        });
        const overallStats = result.overallStats[0] || {
            totalPayments: 0,
            totalRevenue: 0,
            averageAmount: 0,
            successfulPayments: 0,
            failedPayments: 0,
            pendingPayments: 0,
            canceledPayments: 0,
            refundedPayments: 0,
        };
        res.status(200).json({
            success: true,
            message: "Payment statistics retrieved successfully",
            data: {
                overview: {
                    totalPayments: overallStats.totalPayments,
                    totalRevenue: overallStats.totalRevenue, // Convert to dollars
                    averageAmount: overallStats.averageAmount,
                    successfulPayments: overallStats.successfulPayments,
                    failedPayments: overallStats.failedPayments,
                    pendingPayments: overallStats.pendingPayments,
                    canceledPayments: overallStats.canceledPayments,
                    refundedPayments: overallStats.refundedPayments,
                    successRate: overallStats.totalPayments > 0
                        ? ((overallStats.successfulPayments /
                            overallStats.totalPayments) *
                            100).toFixed(2)
                        : 0,
                },
                statusBreakdown,
                productTypeBreakdown,
                recentPayments: result.recentPayments,
            },
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error getting payment statistics:", err);
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Failed to get payment statistics",
        });
    }
});
exports.PaymentController = {
    createPaymentController,
    getPaymentStatusController,
    refundPaymentController,
    getUserPaymentsController,
    getAllPaymentsController,
    getPaymentStatisticsController,
};
