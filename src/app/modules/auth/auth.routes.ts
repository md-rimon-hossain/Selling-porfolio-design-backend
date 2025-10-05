import express from "express";
import { login, registerUser } from "./auth.controller";
import { validateBody } from "../../middlewares/validateZodScheamas";
import { loginSchema, registerSchema } from "./auth.validation";

const router = express.Router();

// Register a new user
router.post("/register", validateBody(registerSchema), registerUser);

// Login user
router.post("/login", validateBody(loginSchema), login);

export default router;
