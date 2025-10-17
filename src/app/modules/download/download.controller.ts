import { Response } from "express";
import { Types } from "mongoose";
import { Download } from "./download.model";
import { Purchase } from "../purchase/purchase.model";
import { Design } from "../design/design.model";
import { User } from "../user/user.model";
import { AuthRequest } from "../../middlewares/auth";

// Get all downloads (Admin only) - with advanced filters
export const getAllDownloads = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "downloadDate",
      sortOrder = "desc",
      downloadType,
      userId,
      designId,
      search,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: Record<string, unknown> = {};

    // Filter by download type
    if (downloadType) {
      filter.downloadType = downloadType;
    }

    // Filter by user ID
    if (userId && Types.ObjectId.isValid(userId as string)) {
      filter.user = new Types.ObjectId(userId as string);
    }

    // Filter by design ID
    if (designId && Types.ObjectId.isValid(designId as string)) {
      filter.design = new Types.ObjectId(designId as string);
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.downloadDate = {} as { $gte?: Date; $lte?: Date };
      if (startDate) {
        (filter.downloadDate as { $gte?: Date; $lte?: Date }).$gte = new Date(
          startDate as string,
        );
      }
      if (endDate) {
        (filter.downloadDate as { $gte?: Date; $lte?: Date }).$lte = new Date(
          endDate as string,
        );
      }
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    // If search is provided, we need to search in populated fields
    if (search) {
      // First, find matching users or designs
      const userIds = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      })
        .distinct("_id")
        .exec();

      const designIds = await Design.find({
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
    const downloads = await Download.find(filter)
      .populate("user", "name email profileImage role")
      .populate("design", "title previewImageUrl price designerName category")
      .populate("purchase", "purchaseType amount transactionId")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    const totalDownloads = await Download.countDocuments(filter);
    const totalPages = Math.ceil(totalDownloads / limitNum);

    // Calculate statistics
    const stats = await Download.aggregate([
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching all downloads:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Download a design
export const downloadDesign = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { designId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(designId)) {
      res.status(400).json({
        success: false,
        message: "Invalid design ID format",
      });
      return;
    }

    // Check if design exists
    const design = await Design.findById(designId);
    if (!design || design.status !== "Active") {
      res.status(404).json({
        success: false,
        message: "Design not found or not available",
      });
      return;
    }

    // Check if user has permission to download this design
    const permission = await checkDownloadPermission(
      userId.toString(),
      designId,
    );

    if (!permission.allowed) {
      res.status(403).json({
        success: false,
        message: permission.reason,
      });
      return;
    }

    // Record the download
    const download = new Download({
      user: userId,
      design: designId,
      downloadType: permission.downloadType,
      purchase: permission.purchaseId,
      downloadDate: new Date(),
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    await download.save();

    // Increment the design download count
    await Design.findByIdAndUpdate(
      designId,
      { $inc: { downloadCount: 1 } },
      { new: true },
    );

    // Update remaining downloads for subscription purchases
    if (permission.downloadType === "subscription" && permission.purchaseId) {
      await Purchase.findByIdAndUpdate(
        permission.purchaseId,
        { $inc: { remainingDownloads: -1 } },
        { new: true },
      );
    }

    // In a real application, you would generate a secure download link
    // or stream the file directly. For now, we'll return download info
    const populatedDownload = await Download.findById(download._id)
      .populate("design", "title previewImageUrl designerName price")
      .populate("user", "name email");

    res.status(200).json({
      success: true,
      message: "Download initiated successfully",
      data: {
        download: populatedDownload,
        downloadUrl: `/api/v1/files/designs/${designId}`, // Mock download URL
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        remainingDownloads:
          permission.downloadType === "subscription"
            ? await Purchase.findById(permission.purchaseId).then(
                (p) => p?.remainingDownloads,
              )
            : "Unlimited",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error downloading design:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Check download permission
const checkDownloadPermission = async (
  userId: string,
  designId: string,
): Promise<{
  allowed: boolean;
  reason?: string;
  downloadType?: "individual_purchase" | "subscription";
  purchaseId?: string;
}> => {
  // Check if user has purchased this design individually
  const individualPurchase = await Purchase.findOne({
    user: userId,
    design: designId,
    purchaseType: "individual",
    status: "completed",
  });

  if (individualPurchase) {
    return {
      allowed: true,
      downloadType: "individual_purchase",
      purchaseId: individualPurchase._id?.toString(),
    };
  }

  // Check if user has an active subscription with remaining downloads
  const activeSubscription = await Purchase.findOne({
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
      purchaseId: activeSubscription._id?.toString(),
    };
  }

  // Check if subscription exists but has no downloads left
  const subscriptionNoDownloads = await Purchase.findOne({
    user: userId,
    purchaseType: "subscription",
    status: "active",
    subscriptionEndDate: { $gt: new Date() },
    remainingDownloads: { $lte: 0 },
  });

  if (subscriptionNoDownloads) {
    return {
      allowed: false,
      reason:
        "You have reached your download limit for this subscription period",
    };
  }

  // Check if subscription has expired
  const expiredSubscription = await Purchase.findOne({
    user: userId,
    purchaseType: "subscription",
    status: "active",
    subscriptionEndDate: { $lte: new Date() },
  });

  if (expiredSubscription) {
    return {
      allowed: false,
      reason:
        "Your subscription has expired. Please renew to continue downloading",
    };
  }

  return {
    allowed: false,
    reason:
      "You need to purchase this design individually or have an active subscription to download it",
  };
};

// Get user's download history
export const getUserDownloads = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "downloadDate",
      sortOrder = "desc",
      downloadType,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { user: req.user?._id };

    if (downloadType) {
      filter.downloadType = downloadType;
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const downloads = await Download.find(filter)
      .populate("design", "title previewImageUrl price designerName")
      .populate("purchase", "purchaseType amount")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-__v -ipAddress -userAgent");

    const totalDownloads = await Download.countDocuments(filter);
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching download history:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get user's subscription status
export const getUserSubscriptionStatus = async (
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

    const activeSubscription = await Purchase.findOne({
      user: userId,
      purchaseType: "subscription",
      status: "completed",
      subscriptionEndDate: { $gt: new Date() },
    })
      .populate(
        "pricingPlan",
        "name description features maxDownloads duration",
      )
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
    const downloadCount = await Download.countDocuments({
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
          downloadLimitReached:
            (activeSubscription.remainingDownloads || 0) <= 0,
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching subscription status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get download analytics (Admin only)
export const getDownloadAnalytics = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { period = "monthly", startDate, endDate } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dateFilter: Record<string, any> = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        downloadDate: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        },
      };
    } else {
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
    const overallStats = await Download.aggregate([
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
    const topDesigns = await Download.aggregate([
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
          startDate: dateFilter.downloadDate?.$gte || "All time",
          endDate: dateFilter.downloadDate?.$lte || "Present",
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching download analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
