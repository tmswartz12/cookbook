import { z } from "zod";

const cloudImage = z
  .object({
    url: z.string().url(),
    publicId: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();

const lineArray = z.array(z.string().trim().min(1, "No empty lines.")).default([]);

const tagArray = z.array(z.string().trim().min(1)).max(20).default([]);

// Base shape shared by create + update.
const base = {
  title: z.string().trim().min(1, "Give it a title."),
  description: z.string().trim().max(280).optional(),
  dateCooked: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date."),
  heroImage: cloudImage.optional(),
  gallery: z.array(cloudImage).max(12).default([]),
  ingredients: lineArray,
  steps: lineArray,
  tags: tagArray,
  cuisine: z.string().trim().max(60).optional(),
  prepMinutes: z.number().int().min(0).max(100000).optional(),
  cookMinutes: z.number().int().min(0).max(100000).optional(),
  servings: z.number().int().min(0).max(1000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  makeAgain: z.boolean().default(false),
  notes: z.string().trim().max(4000).optional(),
  sourceUrl: z.string().trim().url().optional().or(z.literal("")),
};

// Reject unknown fields (.strict).
export const createRecipeSchema = z.object(base).strict();

// Update: all optional.
export const updateRecipeSchema = z.object(base).partial().strict();

export type CreateRecipeBody = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeBody = z.infer<typeof updateRecipeSchema>;

/** Flatten a ZodError into { field: message } for the API error shape. */
export function zodFields(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
