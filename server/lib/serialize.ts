import type { Recipe as RecipeType } from "@shared/types";

/** Convert a lean/raw Mongo recipe document into the shared Recipe API shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeRecipe(doc: any): RecipeType {
  return {
    _id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    description: doc.description ?? undefined,
    dateCooked: toISO(doc.dateCooked),
    heroImage: doc.heroImage ?? undefined,
    gallery: doc.gallery ?? [],
    ingredients: doc.ingredients ?? [],
    steps: doc.steps ?? [],
    tags: doc.tags ?? [],
    cuisine: doc.cuisine ?? undefined,
    prepMinutes: doc.prepMinutes ?? undefined,
    cookMinutes: doc.cookMinutes ?? undefined,
    servings: doc.servings ?? undefined,
    rating: doc.rating ?? undefined,
    makeAgain: Boolean(doc.makeAgain),
    notes: doc.notes ?? undefined,
    sourceUrl: doc.sourceUrl ?? undefined,
    createdBy: doc.createdBy,
    createdAt: toISO(doc.createdAt),
    updatedAt: toISO(doc.updatedAt),
  };
}

function toISO(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}
