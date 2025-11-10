export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string; // Optional for OAuth users
  role: "super_admin" | "admin" | "customer" | "designer" | "instructor";
  isActive: boolean;
  isDeleted: boolean;
  profileImage?: string;
  // OAuth fields
  googleId?: string;
  githubId?: string;
  authProvider: "local" | "google" | "github";
  createdAt?: Date;
  updatedAt?: Date;
}
