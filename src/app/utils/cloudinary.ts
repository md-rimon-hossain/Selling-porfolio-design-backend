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
  resource_type: "auto" | "image" | "video" | "raw" = "auto",
  options?: {
    originalName?: string;
    forceFormat?: string; // e.g. 'zip' when you know it's a zip
    useFilename?: boolean;
    uniqueFilename?: boolean;
  },
): Promise<{
  public_id: string;
  secure_url: string;
  file_format: string;
  bytes: number;
  version?: number | string;
  raw?: unknown;
}> {
  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, unknown> = { folder, resource_type };
    if (options?.useFilename) uploadOptions.use_filename = true;
    if (options?.uniqueFilename === false)
      uploadOptions.unique_filename = true;
    if (options?.forceFormat) uploadOptions.format = options.forceFormat;
    // Let Cloudinary use the original filename where helpful
    if (options?.originalName && !uploadOptions.public_id) {
      // do not set public_id to full filename including extension; let use_filename handle it
      // but we still pass use_filename to hint Cloudinary
      uploadOptions.original_filename = options.originalName;
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: unknown, result: unknown) => {
        if (error) return reject(error);
        // result types from SDK are loose; access carefully via unknown
        const r = result as unknown as Record<string, unknown>;
        const ver = r && (r.version ?? r.v) ? (r.version ?? r.v) : undefined;
        resolve({
          public_id: String(r.public_id ?? ""),
          secure_url: String(r.secure_url ?? ""),
          file_format: String(r.format ?? ""),
          bytes: Number(r.bytes ?? 0),
          version: ver !== undefined ? String(ver) : undefined,
          raw: r,
        });
      },
    );

    streamifier.createReadStream(buffer).pipe(stream as unknown as Writable);
  });
}

export async function deleteByPublicId(
  publicId: string,
  resource_type: "auto" | "image" | "video" | "raw" = "auto",
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

