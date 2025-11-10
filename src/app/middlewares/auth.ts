import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { User } from "../modules/user/user.model";
import { IUser } from "../modules/user/user.interface";
import config from "../config/index";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get token from cookie OR Authorization header
    // Cookie: for traditional login
    // Header: for OAuth login (NextAuth sends token in Authorization header)
    let token = req.cookies?.token;

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
        message:
          "Access denied. No token provided. You must be logged in to access this resource.",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      config.jwt_secret as string,
    ) as JWTPayload;
    const user = await User.findById(decoded.userId).select("-isDeleted");

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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

// Authorization middleware to check user roles who can access certain routes
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
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
        message:
          "Forbidden. You don't have permission to access this resource.",
      });
      return;
    }

    next();
  };
};
