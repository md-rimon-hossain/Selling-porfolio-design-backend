"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const validateZodSchemas_1 = require("../../middlewares/validateZodSchemas");
const design_validation_1 = require("./design.validation");
const design_controller_1 = require("./design.controller");
const router = express_1.default.Router();
// Get all designs (Public - anyone can see)
router.get("/", (0, validateZodSchemas_1.validateQuery)(design_validation_1.designQuerySchema), design_controller_1.getAllDesigns);
// Get single design by ID (Public)
router.get("/:id", (0, validateZodSchemas_1.validateParams)(design_validation_1.designParamsSchema), design_controller_1.getSingleDesign);
// Create new design (Admin only)
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateBody)(design_validation_1.createDesignSchema), design_controller_1.createNewDesign);
// Update design (Admin only)
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateParams)(design_validation_1.designParamsSchema), (0, validateZodSchemas_1.validateBody)(design_validation_1.updateDesignSchema), design_controller_1.updateDesign);
// Delete design (Admin only)
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, validateZodSchemas_1.validateParams)(design_validation_1.designParamsSchema), design_controller_1.deleteDesign);
exports.default = router;
