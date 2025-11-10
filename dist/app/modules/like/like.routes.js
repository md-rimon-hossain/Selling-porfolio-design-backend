"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const validateZodSchemas_1 = require("../../middlewares/validateZodSchemas");
const like_validation_1 = require("./like.validation");
const like_controller_1 = require("./like.controller");
const router = express_1.default.Router();
/**
 * @route   POST /api/likes/:designId
 * @desc    Toggle like/unlike on a design
 * @access  Private (Authenticated users)
 */
router.post("/:designId", auth_1.authenticate, (0, validateZodSchemas_1.validateParams)(like_validation_1.likeParamsSchema), like_controller_1.toggleLikeDesign);
/**
 * @route   GET /api/likes/my-likes
 * @desc    Get current user's liked designs
 * @access  Private (Authenticated users)
 */
router.get("/my-likes", auth_1.authenticate, (0, validateZodSchemas_1.validateQuery)(like_validation_1.likeQuerySchema), like_controller_1.getUserLikedDesigns);
/**
 * @route   GET /api/likes/:designId/check
 * @desc    Check if current user liked a specific design
 * @access  Private (Authenticated users)
 */
router.get("/:designId/check", auth_1.authenticate, (0, validateZodSchemas_1.validateParams)(like_validation_1.likeParamsSchema), like_controller_1.checkIfUserLikedDesign);
/**
 * @route   GET /api/likes/:designId/likers
 * @desc    Get all users who liked a specific design
 * @access  Private (Admin only)
 */
router.get("/:designId/likers", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateParams)(like_validation_1.likeParamsSchema), (0, validateZodSchemas_1.validateQuery)(like_validation_1.likeQuerySchema), like_controller_1.getDesignLikers);
exports.default = router;
