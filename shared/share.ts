import type { Recipe } from "./types";

/** Display name used in titles and share cards. */
export const SITE_NAME = "Tyler & Sarah's Cookbook";

/** Cloudinary transform for social-share / OG preview cards (1200×630, the
 *  standard OG aspect). Cropped to fill so the photo always fills the card. */
export const OG_IMAGE = "f_jpg,q_auto,c_fill,w_1200,h_630,g_auto";

/** Build an absolute Cloudinary delivery URL for a public_id + transform.
 *  Unlike the client `cld()` helper this takes the cloud name explicitly so it
 *  works server-side too. Returns "" when no cloud name is configured. */
export function cloudinaryUrl(
  cloudName: string | undefined,
  publicId: string,
  transform: string,
): string {
  if (!cloudName) return "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
}

export interface ShareMeta {
  title: string; // page <title> / share-sheet title
  description: string; // OG/Twitter description
  imageUrl: string; // absolute OG image URL ("" if none)
  url: string; // absolute canonical URL
}

/** Single source of truth for a recipe's shareable metadata, used by the
 *  client share button and the server-side OG-tag injector alike. */
export function recipeShareMeta(
  recipe: Pick<Recipe, "title" | "slug" | "description" | "heroImage">,
  opts: { siteOrigin: string; siteName: string; cloudName?: string },
): ShareMeta {
  const description =
    recipe.description?.trim() ||
    `A recipe from ${opts.siteName}.`;
  const imageUrl = recipe.heroImage
    ? cloudinaryUrl(opts.cloudName, recipe.heroImage.publicId, OG_IMAGE)
    : "";
  return {
    title: `${recipe.title} — ${opts.siteName}`,
    description,
    imageUrl,
    url: `${opts.siteOrigin.replace(/\/$/, "")}/recipe/${recipe.slug}`,
  };
}
