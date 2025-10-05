import { Request, Response } from "express";
import { User } from "../user/user.model";
import jwt from "jsonwebtoken";
import config from "../../config/index";
import bcrypt from "bcrypt";

// create JWT token
const createToken = (userId: string, email: string, role: string): string => {
  if (!config.jwt_secret) {
    throw new Error("JWT secret is missing!");
  }

  return jwt.sign({ userId, email, role }, config.jwt_secret, {
    expiresIn: config.jwt_expires_in || "24h",
  } as jwt.SignOptions);
};

const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    // eslint-disable-next-line no-console
    console.log(req.body);

    //Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
      return;
    }

    // Create new user
    const user = new User({
      name,
      email,
      password: await bcrypt.hash(password, config.bcrypt_salt_rounds), // Hash password before saving
      role: role || "customer",
    });

    await user.save();

    // Create JWT token for the new user
    const token = createToken(user._id as string, user.email, user.role);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user._id,

          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          role: user.role,
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: errorMessage,
    });
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with email and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not exists with this email",
      });
      return;
    }

    // Check password using bcrypt comparison
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password as string,
    );
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid password Please try again with correct password",
      });
      return;
    }

    // Create JWT token for successful login
    const token = createToken(user._id as string, user.email, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: errorMessage,
    });
  }
};

export { registerUser, login };
