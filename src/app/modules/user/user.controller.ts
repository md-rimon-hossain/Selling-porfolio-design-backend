import { Request, Response } from "express";
import { IUser } from "./user.interface";
import { User } from "./user.model";
import bcrypt from "bcrypt";
import config from "../../config/index";

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: req.user,
  });
};

// Get all users (Admin only)
const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      role,
      isActive,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter: Record<string, unknown> = {
      isDeleted: false, // Exclude deleted users
    };

    // Role filter
    if (role) {
      filter.role = role;
    }

    // Active status filter
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    // Search filter (search in name and email)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Determine sort direction
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy as string]: sortDirection,
    };

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limitNum);

    // Fetch users with filters, pagination, and sorting
    const users = await User.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalUsers,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        role: role || null,
        isActive: isActive !== undefined ? isActive === "true" : null,
        search: search || null,
        sortBy,
        sortOrder,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: errorMessage,
    });
  }
};

// Get single user by ID (Admin only)
const getSingleUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      _id: id,
      isDeleted: false,
    }).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: errorMessage,
    });
  }
};

// Update user (Admin or user themselves)
const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const currentUser = req.user;

    // Check if user exists
    const user = await User.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check permissions: Admin can update anyone, users can only update themselves
    if (currentUser?.role !== "admin" && currentUser?._id?.toString() !== id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to update this user",
      });
      return;
    }

    // Don't allow updating sensitive fields through this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData.isDeleted;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: errorMessage,
    });
  }
};

// Delete user (Admin only - soft delete)
const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Soft delete
    await User.findByIdAndUpdate(id, {
      isDeleted: true,
      isActive: false,
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: errorMessage,
    });
  }
};

// Change password (Authenticated users)
const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Verify passwords match
    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: "New password and confirmation password do not match",
      });
      return;
    }

    // Get user with password
    const user = await User.findById(userId).select("+password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password as string,
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      config.bcrypt_salt_rounds,
    );

    // Update password
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: errorMessage,
    });
  }
};

export {
  getUserProfile,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  changePassword,
};
