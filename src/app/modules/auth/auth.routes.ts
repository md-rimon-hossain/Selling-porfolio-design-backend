import express from "express";
import {
  loginController,
  logoutController,
  registerUserController,
} from "./auth.controller";
import { oauthSyncController } from "./oauth-sync.controller";
import { validateBody } from "../../middlewares/validateZodSchemas";
import { loginSchema, registerSchema } from "./auth.validation";

const router = express.Router();

// Register a new user
router.post("/register", validateBody(registerSchema), registerUserController);

// Login user
router.post("/login", validateBody(loginSchema), loginController);

// Logout user
router.post("/logout", logoutController);

// OAuth sync endpoint (called by NextAuth after Google/GitHub login)
router.post("/oauth", oauthSyncController);

export default router;
