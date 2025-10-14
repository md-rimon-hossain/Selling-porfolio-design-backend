import type { Types } from "mongoose";

export interface IDesign {
  _id?: string;
  title: string;
  category: Types.ObjectId;
  description: string;
  previewImageUrl: string;
  designerName: string;
  usedTools: string[];
  effectsUsed: string[];
  price: number;
  processDescription: string;
  complexityLevel: "Basic" | "Intermediate" | "Advanced";
  tags: string[];
  status: "Active" | "Draft" | "Archived";
  isDeleted: boolean;
  likesCount: number;
  downloadCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}
