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
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../modules/user/user.model");
const index_1 = __importDefault(require("../config/index"));
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get token from cookie OR Authorization header
        // Cookie: for traditional login
        // Header: for OAuth login (NextAuth sends token in Authorization header)
        let token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
        // If no cookie, check Authorization header
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7); // Remove "Bearer " prefix
            }
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Access denied. No token provided. You must be logged in to access this resource.",
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, index_1.default.jwt_secret);
        const user = yield user_model_1.User.findById(decoded.userId).select("-isDeleted");
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Invalid token. User not found.",
            });
            return;
        }
        // Check if user is active
        if (!user.isActive) {
            res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact support.",
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Authentication error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please login again.",
        });
    }
});
exports.authenticate = authenticate;
// Authorization middleware to check user roles who can access certain routes
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Access denied. Please Login first.",
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: "Forbidden. You don't have permission to access this resource.",
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
