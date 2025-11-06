import { Response } from "express";
import { Types } from "mongoose";
import { createPaymentSchema, refundPaymentSchema } from "./payment.validation";
import { PaymentServiceInstance } from "./payment.services";
import { AuthRequest } from "../../middlewares/auth";

/**
 * Create a new payment intent for any product type
 * Supports: designs, courses, subscriptions
 */
const createPaymentController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // Validate request body
    const parseResult = createPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.errors,
      });
      return;
    }

    const { productType, productId, currency } = parseResult.data;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Create payment intent
    const result = await PaymentServiceInstance.createPaymentIntentService(
      userId.toString(),
      productType,
      productId,
      currency,
    );

    res.status(200).json({
      success: true,
      message: "Payment intent created successfully",
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      },
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error creating payment:", err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to create payment",
    });
  }
};

/**
 * Get payment status by payment intent ID
 * Returns payment details including linked purchase if completed
 */
const getPaymentStatusController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      res.status(400).json({
        success: false,
        message: "Payment intent ID is required",
      });
      return;
    }

    const payment =
      await PaymentServiceInstance.getPaymentStatusService(paymentIntentId);

    // Check if user is authorized to view this payment
    // userId is populated, so we need to access _id if it's an object
    const paymentUserId =
      typeof payment.userId === "object" && payment.userId !== null
        ? (payment.userId as { _id: Types.ObjectId })._id.toString()
        : payment.userId.toString();

    if (
      req.user?.role !== "admin" &&
      paymentUserId !== req.user?._id?.toString()
    ) {
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
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error getting payment status:", err);
    res.status(500).json({
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to get payment status",
    });
  }
};

/**
 * Refund a payment (Admin only)
 * Creates refund on Stripe and updates Purchase record
 */
const refundPaymentController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // Check admin authorization
    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only admins can process refunds",
      });
      return;
    }

    // Validate request body
    const parseResult = refundPaymentSchema.safeParse(req.body);
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
    const result = await PaymentServiceInstance.refundPaymentService(
      paymentIntentId,
      amount,
      reason,
    );

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: {
        status: result.status,
        refundId: result.refundId,
      },
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error processing refund:", err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to process refund",
    });
  }
};

/**
 * Get user's payment history
 */
const getUserPaymentsController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const { Payment } = await import("./payment.model");

    const payments = await Payment.find({ userId })
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
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error getting payment history:", err);
    res.status(500).json({
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to get payment history",
    });
  }
};

/**
 * Get all payments with filters (Admin only)
 * Supports pagination, filtering by status, user, product type, date range
 */
const getAllPaymentsController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      productType,
      userId,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }

    if (productType) {
      filter.productType = productType;
    }

    if (userId && Types.ObjectId.isValid(userId as string)) {
      filter.userId = new Types.ObjectId(userId as string);
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const { Payment } = await import("./payment.model");

    // Get payments with populated data
    const payments = await Payment.find(filter)
      .populate("userId", "name email profileImage role")
      .populate("designId", "title basePrice previewImageUrls")
      .populate("courseId", "title basePrice thumbnailImageUrl")
      .populate("pricingPlanId", "name price duration")
      .populate("purchaseId")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    const totalPayments = await Payment.countDocuments(filter);
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
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error getting all payments:", err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to get payments",
    });
  }
};

/**
 * Get payment statistics (Admin only)
 * Returns counts by status, revenue, product type breakdown
 */
const getPaymentStatisticsController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: Record<string, any> = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate as string);
      }
    }

    const { Payment } = await import("./payment.model");

    // Get payment statistics
    const statistics = await Payment.aggregate([
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
    const statusBreakdown: Record<string, { count: number; amount: number }> =
      {};
    result.statusCounts.forEach(
      (item: { _id: string; count: number; totalAmount: number }) => {
        statusBreakdown[item._id] = {
          count: item.count,
          amount: item.totalAmount,
        };
      },
    );

    // Format product type counts
    const productTypeBreakdown: Record<
      string,
      { count: number; amount: number }
    > = {};
    result.productTypeCounts.forEach(
      (item: { _id: string; count: number; totalAmount: number }) => {
        productTypeBreakdown[item._id] = {
          count: item.count,
          amount: item.totalAmount,
        };
      },
    );

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
          successRate:
            overallStats.totalPayments > 0
              ? (
                  (overallStats.successfulPayments /
                    overallStats.totalPayments) *
                  100
                ).toFixed(2)
              : 0,
        },
        statusBreakdown,
        productTypeBreakdown,
        recentPayments: result.recentPayments,
      },
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error getting payment statistics:", err);
    res.status(500).json({
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to get payment statistics",
    });
  }
};

export const PaymentController = {
  createPaymentController,
  getPaymentStatusController,
  refundPaymentController,
  getUserPaymentsController,
  getAllPaymentsController,
  getPaymentStatisticsController,
};
