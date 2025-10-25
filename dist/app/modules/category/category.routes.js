"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const validateZodSchemas_1 = require("../../middlewares/validateZodSchemas");
const category_validation_1 = require("./category.validation");
const category_controller_1 = require("./category.controller");
const router = express_1.default.Router();
// Get all categories (Public)
router.get("/", category_controller_1.getAllCategories);
// Get single category by ID (Public)
router.get("/:id", (0, validateZodSchemas_1.validateParams)(category_validation_1.categoryParamsSchema), category_controller_1.getSingleCategory);
// Create new category (Admin only)
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateBody)(category_validation_1.createCategorySchema), category_controller_1.createCategory);
// Update category (Admin only)
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateParams)(category_validation_1.categoryParamsSchema), (0, validateZodSchemas_1.validateBody)(category_validation_1.updateCategorySchema), category_controller_1.updateCategory);
// Delete category (Admin only)
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateParams)(category_validation_1.categoryParamsSchema), category_controller_1.deleteCategory);
exports.default = router;
