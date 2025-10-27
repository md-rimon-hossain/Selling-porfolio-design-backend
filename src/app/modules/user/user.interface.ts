export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: "super_admin" | "admin" | "customer" | "designer" | "instructor";
  isActive: boolean;
  isDeleted: boolean;
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

