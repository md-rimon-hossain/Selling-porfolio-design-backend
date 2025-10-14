import express from "express";
import { loginController, registerUserController } from "./auth.controller";
import { validateBody } from "../../middlewares/validateZodSchemas";
import { loginSchema, registerSchema } from "./auth.validation";

const router = express.Router();

// Register a new user
router.post("/register", validateBody(registerSchema), registerUserController);

// Login user
router.post("/login", validateBody(loginSchema), loginController);

export default router;
