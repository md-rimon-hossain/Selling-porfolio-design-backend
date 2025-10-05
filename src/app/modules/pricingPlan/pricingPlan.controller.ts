import { Request, Response} from "express"
import { Types } from "mongoose";
import { IPricingPlan, PricingPlan } from "./pricingPlan.model";
import { Purchase } from "../purchase/purchase.model";

// Create a new pricing plan (Admin only)
export const createPricingPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      duration,
      features,
      maxDesigns,
      maxDownloads,
      priority,
      isActive,
      discountPercentage,
      validUntil,
    } = req.body;

    // Check if pricing plan with same name already exists and is active
    const existingPlan = await PricingPlan.findOne({ 
      name: name.toLowerCase(),
      isActive: true 
    });

    if (existingPlan) {
      res.status(409).json({
        success: false,
        message: "Pricing plan with this name already exists",
      });
    }

    // Calculate discounted price if discount is provided
    let finalPrice = price;
    if (discountPercentage && discountPercentage > 0) {
      finalPrice = price - (price * discountPercentage) / 100;
    }

    const newPricingPlan = new PricingPlan({
      name: name.toLowerCase(),
      description,
      price,
      finalPrice,
      duration,
      features,
      maxDesigns,
      maxDownloads,
      priority: priority || 1,
      isActive: isActive !== undefined ? isActive : true,
      discountPercentage: discountPercentage || 0,
      validUntil,
    });

    const savedPlan = await newPricingPlan.save();

    res.status(201).json({
      success: true,
      message: "Pricing plan created successfully",
      data: savedPlan,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error creating pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all pricing plans
export const getAllPricingPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "priority",
      sortOrder = "asc",
      isActive,
      minPrice,
      maxPrice,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (minPrice) {
      filter.finalPrice = { ...filter.finalPrice, $gte: parseFloat(minPrice as string) };
    }

    if (maxPrice) {
      filter.finalPrice = { ...filter.finalPrice, $lte: parseFloat(maxPrice as string) };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { features: { $elemMatch: { $regex: search, $options: "i" } } },
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const pricingPlans = await PricingPlan.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    const totalPlans = await PricingPlan.countDocuments(filter);
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching pricing plans:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get active pricing plans only (for public view)
export const getActivePricingPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const pricingPlans = await PricingPlan.find({ 
      isActive: true,
      $or: [
        { validUntil: { $gte: new Date() } },
        { validUntil: null }
      ]
    })
      .sort({ priority: 1, finalPrice: 1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Active pricing plans retrieved successfully",
      data: pricingPlans,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching active pricing plans:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get single pricing plan by ID
export const getPricingPlanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid pricing plan ID format",
      });
    }

    const pricingPlan = await PricingPlan.findById(id).select("-__v");

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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update pricing plan (Admin only)
export const updatePricingPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid pricing plan ID format",
      });
    }

    // Check if plan exists
    const existingPlan : IPricingPlan | null = await PricingPlan.findById(id);
    
    if (!existingPlan) {
      res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    // If name is being updated, check for duplicates
    if (updateData.name && updateData.name.toLowerCase() !== existingPlan?.name) {
      const duplicatePlan = await PricingPlan.findOne({
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
      const price = updateData.price || existingPlan?.price;
      const discount = updateData.discountPercentage !== undefined 
        ? updateData.discountPercentage 
        : existingPlan?.discountPercentage;
      
      updateData.finalPrice = discount > 0 ? price - (price * discount) / 100 : price;
    }

    // Convert name to lowercase if provided
    if (updateData.name) {
      updateData.name = updateData.name.toLowerCase();
    }

    const updatedPlan = await PricingPlan.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-__v");

    res.status(200).json({
      success: true,
      message: "Pricing plan updated successfully",
      data: updatedPlan,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error updating pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete pricing plan (Admin only)
export const deletePricingPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid pricing plan ID format",
      });
    }

    const pricingPlan = await PricingPlan.findById(id);
    if (!pricingPlan) {
      res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    // Check if plan is being used in any active purchases
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Purchase } = require("../purchase/purchase.model");
    const activePurchases = await Purchase.countDocuments({
      pricingPlan: id,
      status: { $in: ["active", "pending"] },
    });

    if (activePurchases > 0 && permanent === "true") {
      res.status(400).json({
        success: false,
        message: "Cannot permanently delete pricing plan with active purchases. Deactivate instead.",
      });
    }

    if (permanent === "true") {
      // Permanent deletion
      await PricingPlan.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        message: "Pricing plan permanently deleted successfully",
      });
    } else {
      // Soft deletion (deactivate)
      const deactivatedPlan = await PricingPlan.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Pricing plan deactivated successfully",
        data: deactivatedPlan,
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error deleting pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get pricing plan analytics (Admin only)
export const getPricingPlanAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = "monthly", startDate, endDate } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dateFilter: Record<string, any> = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        },
      };
    } else {
      // Default period-based filtering
      switch (period) {
        case "daily":
          dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 1)) };
          break;
        case "weekly":
          dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
          break;
        case "monthly":
          dateFilter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
          break;
        case "yearly":
          dateFilter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
          break;
      }
    }

    // Get purchase statistics for each pricing plan
    // eslint-disable-next-line @typescript-eslint/no-require-imports

    const planAnalytics = await Purchase.aggregate([
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
    const totalPlans = await PricingPlan.countDocuments();
    const activePlans = await PricingPlan.countDocuments({ isActive: true });
    const totalPurchases = await Purchase.countDocuments(dateFilter);
    const totalRevenue = await Purchase.aggregate([
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
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        planAnalytics,
        period,
        dateRange: {
          startDate: dateFilter.createdAt?.$gte || "All time",
          endDate: dateFilter.createdAt?.$lte || "Present",
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching pricing plan analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
