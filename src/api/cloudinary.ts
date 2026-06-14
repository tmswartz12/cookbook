const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;

/**
 * Build a transformed Cloudinary delivery URL from a public_id.
 * We never serve originals — always go through f_auto,q_auto for
 * automatic format (WebP/AVIF) + quality, handled at the CDN edge.
 *
 *   cld(publicId, "f_auto,q_auto,c_fill,w_700,h_520,g_auto")  // card thumb
 *   cld(publicId, "f_auto,q_auto,w_1600")                     // detail hero
 */
export function cld(publicId: string, transform: string): string {
  if (!cloudName) {
    // Without a cloud name configured we can't build a URL; callers should
    // fall back to the stored secure_url or a placeholder.
    return "";
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
}

export const CARD_THUMB = "f_auto,q_auto,c_fill,w_700,h_520,g_auto";
export const DETAIL_HERO = "f_auto,q_auto,w_1600";
export const GALLERY_THUMB = "f_auto,q_auto,c_fill,w_400,h_400,g_auto";
export const LIGHTBOX = "f_auto,q_auto,w_1600";
