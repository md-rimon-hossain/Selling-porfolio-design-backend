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
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided from client side.",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      config.jwt_secret as string,
    ) as JWTPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid token.",
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
