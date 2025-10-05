export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "customer";
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

