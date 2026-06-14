import type { CloudImage } from "@shared/types";
import { signUpload } from "./client";

const MAX_EDGE = 2000;

/**
 * Downscale an image in-browser via <canvas> so the longest edge is ≤ MAX_EDGE,
 * keeping uploads light. Returns a Blob (JPEG). Skips work for already-small images.
 */
async function downscale(file: File): Promise<Blob> {
  // Only attempt for raster images the canvas can draw.
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const { width, height } = bitmap;
  const longest = Math.max(width, height);
  if (longest <= MAX_EDGE) {
    bitmap.close();
    return file;
  }

  const scale = MAX_EDGE / longest;
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.9);
  });
}

/**
 * Upload a single image: get a signed payload from our API, downscale locally,
 * then POST directly to Cloudinary. Returns a CloudImage for the recipe payload.
 */
export async function uploadImage(file: File): Promise<CloudImage> {
  const { signature, timestamp, apiKey, cloudName, folder } = await signUpload();
  const blob = await downscale(file);

  const form = new FormData();
  form.append("file", blob);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}). ${detail}`.trim());
  }

  const data = (await res.json()) as {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
  };

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}
