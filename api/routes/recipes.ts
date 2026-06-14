import { Router, type Request } from "express";
import { Recipe } from "../models/Recipe";
import { serializeRecipe } from "../lib/serialize";
import { slugify, randomSuffix, normalizeTags } from "../lib/slug";
import { createRecipeSchema, updateRecipeSchema, zodFields } from "../lib/validation";
import { requireEditor, currentEmail } from "../lib/auth";
import { destroyImage } from "../lib/cloudinary";
import type { Cook, RecipeListResponse, RecipeSort } from "@shared/types";

const router = Router();
export const tagsRouter = Router();

const COOKS: Cook[] = ["tyler", "sarah", "both", "guest"];
const SORTS: RecipeSort[] = ["newest", "oldest", "rating", "title"];

const SORT_SPEC: Record<RecipeSort, Record<string, 1 | -1>> = {
  newest: { dateCooked: -1 },
  oldest: { dateCooked: 1 },
  rating: { rating: -1, dateCooked: -1 },
  title: { title: 1 },
};

function parseListQuery(req: Request) {
  const q = req.query;
  const search = typeof q.search === "string" ? q.search.trim() : "";
  const cook = COOKS.includes(q.cook as Cook) ? (q.cook as Cook) : undefined;
  const tag = typeof q.tag === "string" ? q.tag.trim().toLowerCase() : "";
  const sort: RecipeSort = SORTS.includes(q.sort as RecipeSort)
    ? (q.sort as RecipeSort)
    : "newest";
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 24));
  return { search, cook, tag, sort, page, limit };
}

// GET /api/recipes — list with search / filter / sort / pagination.
router.get("/", async (req, res, next) => {
  try {
    const { search, cook, tag, sort, page, limit } = parseListQuery(req);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (cook) filter.cook = cook;
    if (tag) filter.tags = tag;
    if (search) filter.$text = { $search: search };

    const sortSpec = SORT_SPEC[sort];

    const [docs, total] = await Promise.all([
      Recipe.find(filter)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Recipe.countDocuments(filter),
    ]);

    const body: RecipeListResponse = {
      items: docs.map(serializeRecipe),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// GET /api/recipes/:slug — single recipe.
router.get("/:slug", async (req, res, next) => {
  try {
    const doc = await Recipe.findOne({ slug: req.params.slug }).lean();
    if (!doc) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }
    res.json(serializeRecipe(doc));
  } catch (err) {
    next(err);
  }
});

// GET /api/tags — distinct tags for the filter chips.
tagsRouter.get("/", async (_req, res, next) => {
  try {
    const tags = (await Recipe.distinct("tags")) as string[];
    tags.sort((a, b) => a.localeCompare(b));
    res.json(tags);
  } catch (err) {
    next(err);
  }
});

// Generate a slug that isn't already taken (optionally ignoring one doc id,
// so editing a recipe without retitling keeps its slug).
async function uniqueSlug(title: string, ignoreId?: string): Promise<string> {
  const baseSlug = slugify(title) || "recipe";
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${randomSuffix()}`;
    const clash = await Recipe.findOne({ slug: candidate }).select("_id").lean();
    if (!clash || String(clash._id) === ignoreId) return candidate;
  }
  // Extremely unlikely fallback.
  return `${baseSlug}-${randomSuffix()}${randomSuffix()}`;
}

// Map a Mongo duplicate-key error on slug to a 409.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isSlugConflict(err: any): boolean {
  return err?.code === 11000 && Boolean(err?.keyPattern?.slug);
}

// POST /api/recipes — create.
router.post("/", requireEditor, async (req, res, next) => {
  const parsed = createRecipeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the highlighted fields.", fields: zodFields(parsed.error) });
    return;
  }
  try {
    const data = parsed.data;
    const slug = await uniqueSlug(data.title);
    const doc = await Recipe.create({
      ...data,
      slug,
      tags: normalizeTags(data.tags),
      dateCooked: new Date(data.dateCooked),
      sourceUrl: data.sourceUrl || undefined,
      createdBy: currentEmail(req),
    });
    res.status(201).json(serializeRecipe(doc.toObject()));
  } catch (err) {
    if (isSlugConflict(err)) {
      res.status(409).json({ error: "A recipe with a similar name already exists." });
      return;
    }
    next(err);
  }
});

// PATCH /api/recipes/:id — update.
router.patch("/:id", requireEditor, async (req, res, next) => {
  const parsed = updateRecipeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the highlighted fields.", fields: zodFields(parsed.error) });
    return;
  }
  try {
    const existing = await Recipe.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }

    const data = parsed.data;
    // Retitling regenerates the slug (keeping the current one if unchanged).
    if (data.title && data.title !== existing.title) {
      existing.slug = await uniqueSlug(data.title, String(existing._id));
    }

    // Assign provided fields only.
    for (const [key, value] of Object.entries(data)) {
      if (key === "dateCooked" && typeof value === "string") {
        existing.set("dateCooked", new Date(value));
      } else if (key === "tags" && Array.isArray(value)) {
        existing.set("tags", normalizeTags(value as string[]));
      } else if (key === "sourceUrl") {
        existing.set("sourceUrl", (value as string) || undefined);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existing.set(key, value as any);
      }
    }

    await existing.save();
    res.json(serializeRecipe(existing.toObject()));
  } catch (err) {
    if (isSlugConflict(err)) {
      res.status(409).json({ error: "A recipe with a similar name already exists." });
      return;
    }
    next(err);
  }
});

// DELETE /api/recipes/:id — delete the recipe and its Cloudinary images.
router.delete("/:id", requireEditor, async (req, res, next) => {
  try {
    const doc = await Recipe.findByIdAndDelete(req.params.id).lean();
    if (!doc) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }
    const images = [doc.heroImage, ...(doc.gallery ?? [])].filter(Boolean);
    await Promise.all(images.map((img) => destroyImage(img!.publicId)));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
