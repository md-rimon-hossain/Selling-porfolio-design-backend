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
exports.changePassword = exports.deleteUser = exports.updateUser = exports.getSingleUser = exports.getAllUsers = exports.getUserProfile = void 0;
const user_model_1 = require("./user.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const index_1 = __importDefault(require("../../config/index"));
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        success: true,
        message: "User profile fetched successfully",
        data: req.user,
    });
});
exports.getUserProfile = getUserProfile;
// Get all users (Admin only)
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role, isActive, search, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", } = req.query;
        // Build filter object
        const filter = {
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
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Determine sort direction
        const sortDirection = sortOrder === "asc" ? 1 : -1;
        const sortOptions = {
            [sortBy]: sortDirection,
        };
        // Get total count for pagination
        const totalUsers = yield user_model_1.User.countDocuments(filter);
        const totalPages = Math.ceil(totalUsers / limitNum);
        // Fetch users with filters, pagination, and sorting
        const users = yield user_model_1.User.find(filter)
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to get users",
            error: errorMessage,
        });
    }
});
exports.getAllUsers = getAllUsers;
// Get single user by ID (Admin only)
const getSingleUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_model_1.User.findOne({
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to get user",
            error: errorMessage,
        });
    }
});
exports.getSingleUser = getSingleUser;
// Update user (Admin or user themselves)
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const updateData = req.body;
        const currentUser = req.user;
        // Check if user exists
        const user = yield user_model_1.User.findOne({
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
        if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) !== "admin" && ((_a = currentUser === null || currentUser === void 0 ? void 0 : currentUser._id) === null || _a === void 0 ? void 0 : _a.toString()) !== id) {
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
        const updatedUser = yield user_model_1.User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).select("-password");
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to update user",
            error: errorMessage,
        });
    }
});
exports.updateUser = updateUser;
// Delete user (Admin only - soft delete)
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_model_1.User.findOne({
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
        yield user_model_1.User.findByIdAndUpdate(id, {
            isDeleted: true,
            isActive: false,
        });
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: errorMessage,
        });
    }
});
exports.deleteUser = deleteUser;
// Change password (Authenticated users)
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
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
        const user = yield user_model_1.User.findById(userId).select("+password");
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        // Verify current password
        const isPasswordValid = yield bcrypt_1.default.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
            return;
        }
        // Hash new password
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, index_1.default.bcrypt_salt_rounds);
        // Update password
        yield user_model_1.User.findByIdAndUpdate(userId, {
            password: hashedPassword,
        });
        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to change password",
            error: errorMessage,
        });
    }
});
exports.changePassword = changePassword;
