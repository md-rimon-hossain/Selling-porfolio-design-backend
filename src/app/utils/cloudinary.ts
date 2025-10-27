import { v2 as cloudinary } from "cloudinary";
import * as streamifier from "streamifier";
import { Writable } from "stream";

// Configure Cloudinary with env vars. Ensure these are set in your environment.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder = "designs",
  resource_type: "auto" | "image" | "video" = "auto",
): Promise<{
  public_id: string;
  secure_url: string;
  file_format: string;
  bytes: number;
}> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (error: unknown, result: unknown) => {
        if (error) return reject(error);
        // result types from SDK are loose; access carefully via unknown
        const r = result as unknown as Record<string, unknown>;
        resolve({
          public_id: String(r.public_id ?? ""),
          secure_url: String(r.secure_url ?? ""),
          file_format: String(r.format ?? ""),
          bytes: Number(r.bytes ?? 0),
        });
      },
    );

    streamifier.createReadStream(buffer).pipe(stream as unknown as Writable);
  });
}

export async function deleteByPublicId(
  publicId: string,
  resource_type: "auto" | "image" | "video" = "auto",
) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type },
      (err: unknown, result: unknown) => {
        if (err) return reject(err);
        resolve(result);
      },
    );
  });
}

export default cloudinary;
