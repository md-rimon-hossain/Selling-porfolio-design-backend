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
exports.logoutController = exports.loginController = exports.registerUserController = void 0;
const user_model_1 = require("../user/user.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = __importDefault(require("../../config/index"));
const bcrypt_1 = __importDefault(require("bcrypt"));
// create JWT token
const createToken = (userId, email, role) => {
    if (!index_1.default.jwt_secret) {
        throw new Error("JWT secret is missing!");
    }
    return jsonwebtoken_1.default.sign({ userId, email, role }, index_1.default.jwt_secret, {
        expiresIn: index_1.default.jwt_expires_in || "24h",
    });
};
const registerUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role } = req.body;
        // eslint-disable-next-line no-console
        console.log(req.body);
        //Check if user already exists
        const existingUser = yield user_model_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
            return;
        }
        // Create new user
        const user = new user_model_1.User({
            name,
            email,
            password: yield bcrypt_1.default.hash(password, index_1.default.bcrypt_salt_rounds), // Hash password before saving
            role: role || "customer",
        });
        yield user.save();
        // Create JWT token for the new user
        const token = createToken(user._id, user.email, user.role);
        // Set httpOnly cookie
        res.cookie("token", token, {
            httpOnly: true, // cannot be accessed by JS
            secure: process.env.NODE_ENV === "production", // only HTTPS in prod
            sameSite: "strict", // protects against CSRF
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profileImage: user.profileImage,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: errorMessage,
        });
    }
});
exports.registerUserController = registerUserController;
const loginController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user with email and include password for comparison
        const user = yield user_model_1.User.findOne({ email }).select("+password");
        if (!user) {
            res.status(401).json({
                success: false,
                message: "User not exists with this email",
            });
            return;
        }
        // Check password using bcrypt comparison
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Invalid password Please try again with correct password",
            });
            return;
        }
        // Create JWT token for successful login
        const token = createToken(user._id, user.email, user.role);
        // Set httpOnly cookie
        res.cookie("token", token, {
            httpOnly: true, // cannot be accessed by JS
            secure: true, // only HTTPS in prod
            sameSite: "none", // protects against CSRF
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        });
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profileImage: user.profileImage || "",
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: errorMessage,
        });
    }
});
exports.loginController = loginController;
const logoutController = (req, res) => {
    if (!req.cookies || !req.cookies.token) {
        res.status(400).json({
            success: false,
            message: "No active session found! You are already logged out.",
        });
        return;
    }
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });
    res.status(200).json({
        success: true,
        message: "Logout successful",
    });
};
exports.logoutController = logoutController;
