import { Request, Response } from "express";
import { User } from "../user/user.model";
import jwt from "jsonwebtoken";
import config from "../../config/index";

// Create JWT token (reusing existing logic)
const createToken = (userId: string, email: string, role: string): string => {
  if (!config.jwt_secret) {
    throw new Error("JWT secret is missing!");
  }

  return jwt.sign({ userId, email, role }, config.jwt_secret, {
    expiresIn: config.jwt_expires_in || "7d",
  } as jwt.SignOptions);
};

/**
 * OAuth Sync Endpoint
 * Called by NextAuth after successful OAuth login (Google/GitHub)
 * Creates or updates user in database and returns JWT token
 *
 * Flow:
 * 1. NextAuth completes OAuth with provider (Google/GitHub)
 * 2. NextAuth sends user data to this endpoint
 * 3. Backend finds/creates user in MongoDB
 * 4. Backend generates JWT token
 * 5. Frontend stores token and uses it for all API calls
 */
export const oauthSyncController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, image, provider, providerId } = req.body;

    // Validate required fields
    if (!email || !provider) {
      res.status(400).json({
        success: false,
        message: "Email and provider are required",
      });
      return;
    }

    // Validate provider
    if (!["google", "github"].includes(provider)) {
      res.status(400).json({
        success: false,
        message: "Invalid provider. Must be 'google' or 'github'",
      });
      return;
    }

    // Check if user exists by email
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update OAuth fields if not already set
      const updateFields: Record<string, string> = {};

      // Update provider-specific ID
      if (provider === "google" && !user.googleId) {
        updateFields.googleId = providerId;
      } else if (provider === "github" && !user.githubId) {
        updateFields.githubId = providerId;
      }

      // Update auth provider if still set to local
      if (user.authProvider === "local") {
        updateFields.authProvider = provider;
      }

      // Update profile image if user doesn't have one
      if (image && !user.profileImage) {
        updateFields.profileImage = image;
      }

      // Apply updates if any
      if (Object.keys(updateFields).length > 0) {
        user = await User.findByIdAndUpdate(
          user._id,
          { $set: updateFields },
          { new: true },
        );
      }
    } else {
      // Create new user from OAuth data
      const newUserData: Record<string, string | boolean | null> = {
        name: name || email.split("@")[0], // Use email prefix if no name
        email,
        authProvider: provider,
        role: "customer",
        isActive: true,
        profileImage: image || null,
      };

      // Set provider-specific ID
      if (provider === "google") {
        newUserData.googleId = providerId;
      } else if (provider === "github") {
        newUserData.githubId = providerId;
      }

      user = await User.create(newUserData);
    }

    // Ensure user is not null
    if (!user) {
      res.status(500).json({
        success: false,
        message: "Failed to create or retrieve user",
      });
      return;
    }

    // Generate JWT token
    const token = createToken(user._id as string, user.email, user.role);

    // Set httpOnly cookie (optional - for extra security)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return success response with token and user data
    res.status(200).json({
      success: true,
      message: "OAuth sync successful",
      data: {
        token, // This is YOUR backend JWT token (NextAuth will store this)
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          authProvider: user.authProvider,
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("OAuth sync error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync OAuth user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
