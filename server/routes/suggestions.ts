import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Suggestion } from "../models/Suggestion";
import { serializeSuggestion } from "../lib/serialize";
import { createSuggestionSchema, zodFields } from "../lib/validation";
import { requireEditor } from "../lib/auth";
import type { SuggestionListResponse } from "@shared/types";

const router = Router();

// The submit endpoint is public, so throttle it to deter spam/abuse.
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Drop blank optional strings so we never persist empty fields.
function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// POST /api/suggestions — public. Anyone can suggest a recipe.
router.post("/", submitLimiter, async (req, res, next) => {
  const parsed = createSuggestionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the highlighted fields.", fields: zodFields(parsed.error) });
    return;
  }
  try {
    const data = parsed.data;
    const doc = await Suggestion.create({
      name: data.name,
      title: data.title,
      description: clean(data.description),
      instagram: clean(data.instagram),
      sourceUrl: clean(data.sourceUrl),
    });
    res.status(201).json(serializeSuggestion(doc.toObject()));
  } catch (err) {
    next(err);
  }
});

// GET /api/suggestions — editor only. Un-cooked first, then newest.
router.get("/", requireEditor, async (_req, res, next) => {
  try {
    const docs = await Suggestion.find().sort({ cooked: 1, createdAt: -1 }).lean();
    const body: SuggestionListResponse = { items: docs.map(serializeSuggestion) };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/suggestions/:id — editor only. Toggle the cooked flag.
router.patch("/:id", requireEditor, async (req, res, next) => {
  try {
    const cooked = req.body?.cooked;
    if (typeof cooked !== "boolean") {
      res.status(400).json({ error: "Send { cooked: true | false }." });
      return;
    }
    const doc = await Suggestion.findByIdAndUpdate(
      req.params.id,
      { cooked },
      { new: true },
    ).lean();
    if (!doc) {
      res.status(404).json({ error: "Suggestion not found." });
      return;
    }
    res.json(serializeSuggestion(doc));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/suggestions/:id — editor only.
router.delete("/:id", requireEditor, async (req, res, next) => {
  try {
    const doc = await Suggestion.findByIdAndDelete(req.params.id).lean();
    if (!doc) {
      res.status(404).json({ error: "Suggestion not found." });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
