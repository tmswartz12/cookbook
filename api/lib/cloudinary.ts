import { v2 as cloudinary } from "cloudinary";
import type { CloudinarySignResponse } from "@shared/types";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export const UPLOAD_FOLDER = "cookbook/recipes";

/**
 * Build signed params for a direct browser → Cloudinary upload. The browser
 * sends exactly the signed params (folder + timestamp) so the signature matches.
 */
export function signUpload(): CloudinarySignResponse {
  ensureConfigured();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: UPLOAD_FOLDER },
    apiSecret,
  );

  return { signature, timestamp, apiKey, cloudName, folder: UPLOAD_FOLDER };
}

/** Delete an image by public_id (used when a recipe is deleted). */
export async function destroyImage(publicId: string): Promise<void> {
  if (!publicId) return;
  ensureConfigured();
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Don't fail the whole delete if one asset is already gone.
    console.warn(`Cloudinary destroy failed for ${publicId}:`, err);
  }
}
