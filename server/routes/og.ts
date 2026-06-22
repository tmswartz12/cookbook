import { Router } from "express";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Recipe } from "../models/Recipe";
import { connectDB } from "../lib/db";
import { serializeRecipe } from "../lib/serialize";
import { SITE_NAME, recipeShareMeta } from "@shared/share";

export const ogRouter = Router();

// The built SPA shell, embedded at build time by scripts/build-api.mjs (esbuild
// `define`), so the bundled serverless function carries it without reading a
// file at runtime. It is intentionally NOT written to api/ as a file: Vercel
// treats every file under api/ as a function and rejects the build because
// api/index.html collides with api/index.js. In dev (tsx, no esbuild define)
// the constant is undefined, so we fall back to reading the repo's dist build.
declare const __OG_SHELL_HTML__: string | undefined;

let shellCache: string | null = null;

function loadShell(): string {
  if (shellCache !== null) return shellCache;
  // Prod: the inlined constant. Dev: read the repo dist build if present.
  const embedded = typeof __OG_SHELL_HTML__ === "string" ? __OG_SHELL_HTML__ : "";
  if (embedded) {
    shellCache = embedded;
    return shellCache;
  }
  try {
    shellCache = readFileSync(join(process.cwd(), "dist", "index.html"), "utf8");
  } catch {
    shellCache = "";
  }
  return shellCache;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Build the <head> tags we inject for a recipe (and the generic site tags as
 *  a fallback when no recipe is provided). */
function metaTags(opts: {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
}): string {
  const t = escapeHtml(opts.title);
  const d = escapeHtml(opts.description);
  const u = escapeHtml(opts.url);
  const img = opts.imageUrl ? escapeHtml(opts.imageUrl) : "";
  const lines = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${u}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${u}" />`,
    `<meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
  ];
  if (img) {
    lines.push(`<meta property="og:image" content="${img}" />`);
    lines.push(`<meta property="og:image:width" content="1200" />`);
    lines.push(`<meta property="og:image:height" content="630" />`);
    lines.push(`<meta name="twitter:image" content="${img}" />`);
  }
  return lines.join("\n    ");
}

/** Inject the given <head> tags into the shell, replacing the static <title>
 *  and <meta name="description"> so crawlers see exactly one of each. */
function injectHead(shell: string, tags: string): string {
  return shell
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/>\s*/i, "")
    .replace(/<\/head>/i, `    ${tags}\n  </head>`);
}

// GET /recipe/:slug — server-rendered <head> for link unfurls; the SPA still
// hydrates and takes over for real browsers.
ogRouter.get("/recipe/:slug", async (req, res, next) => {
  try {
    const shell = loadShell();
    if (!shell) {
      // No shell available (shouldn't happen in prod) — let the SPA handle it.
      res.status(204).end();
      return;
    }

    const origin = `${req.protocol}://${req.get("host")}`;
    let tags: string;

    try {
      await connectDB();
      const doc = await Recipe.findOne({ slug: req.params.slug }).lean();
      if (doc) {
        const recipe = serializeRecipe(doc);
        const share = recipeShareMeta(recipe, {
          siteOrigin: origin,
          siteName: SITE_NAME,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        });
        tags = metaTags(share);
      } else {
        // Unknown slug — generic tags; the SPA will render its 404.
        tags = metaTags({
          title: SITE_NAME,
          description: "Recipes we cook, with photos.",
          url: `${origin}/recipe/${req.params.slug}`,
          imageUrl: "",
        });
      }
    } catch {
      // DB unreachable — serve the shell with generic tags rather than error.
      tags = metaTags({
        title: SITE_NAME,
        description: "Recipes we cook, with photos.",
        url: `${origin}/recipe/${req.params.slug}`,
        imageUrl: "",
      });
    }

    res
      .status(200)
      .set("Content-Type", "text/html; charset=utf-8")
      // Short edge cache so refreshed photos/titles propagate to unfurls.
      .set("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400")
      .send(injectHead(shell, tags));
  } catch (err) {
    next(err);
  }
});
