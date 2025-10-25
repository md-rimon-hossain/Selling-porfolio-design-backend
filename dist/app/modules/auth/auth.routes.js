"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const validateZodSchemas_1 = require("../../middlewares/validateZodSchemas");
const auth_validation_1 = require("./auth.validation");
const router = express_1.default.Router();
// Register a new user
router.post("/register", (0, validateZodSchemas_1.validateBody)(auth_validation_1.registerSchema), auth_controller_1.registerUserController);
// Login user
router.post("/login", (0, validateZodSchemas_1.validateBody)(auth_validation_1.loginSchema), auth_controller_1.loginController);
router.post("/logout", auth_controller_1.logoutController);
exports.default = router;
