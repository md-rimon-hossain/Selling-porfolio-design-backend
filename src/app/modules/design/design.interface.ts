import type { Types } from "mongoose";

// file: design.interface.ts (or similar)

export interface IDownloadableFile {
  /** The unique ID assigned by the cloud storage (Cloudinary public_id). */
  public_id: string;

  /** A secure identifier; the actual signed download URL is generated on demand. */
  secure_url: string;

  /** The format/extension of the source file (e.g., 'zip', 'psd', 'fig'). */
  file_format: string;

  /** The size of the file in bytes. */
  file_size: number;
}

export interface IDesign {
  _id?: string;
  title: string;
  /** Reference ID to the main category (ObjectId as string). */
  mainCategory: Types.ObjectId;

  /** Reference ID to the sub category (ObjectId as string). */
  subCategory: Types.ObjectId;
  /** To classify the product (e.g., "Logo", "UI Kit"). */
  designType: "Logo" | "Poster" | "UI/UX Design" | "Presentation"| "Print/Packaging" | "Illustration/Art" | "Social Media Graphic" | "Other";

  description: string;
  /** A list of public URLs for images that showcase the design (gallery, mockups). */
  previewImageUrls: string[];
  designer: Types.ObjectId; // Changed to ObjectId to reference User
  usedTools: string[];
  effectsUsed: string[];
  // 💡 Base Price (The original, non-sale price)
  basePrice: number;
  // 💡 Discounted Price (The final price if on sale, otherwise the same as basePrice, or null/undefined)
  discountedPrice: number;
  
  currencyCode: string; // e.g., "BDT", "EUR"
  currencyDisplay: string; // e.g., "৳19.99", "€17.49"

  /** Details for the primary secure, downloadable file (e.g., the ZIP file). */
  downloadableFile: IDownloadableFile;
  /** List of files/formats included in the main download (e.g., ["AI", "EPS", "PNG"]). */
  includedFormats: string[];
  processDescription: string;
  complexityLevel: "Basic" | "Intermediate" | "Advanced";
  tags: string[];
  status: "Active" | "Pending" | "Rejected" | "Inactive";
  isDeleted: boolean;
  likesCount: number;
  downloadCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}
