import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CloudImage, Cook, RecipeInput } from "@shared/types";
import {
  errorMessage,
  useCreateRecipe,
  useRecipe,
  useUpdateRecipe,
} from "../api/client";
import { ImageUploader } from "../components/ImageUploader";
import { StarRating } from "../components/StarRating";

interface Props {
  mode: "create" | "edit";
}

const COOKS: { value: Cook; label: string }[] = [
  { value: "tyler", label: "Tyler" },
  { value: "sarah", label: "Sarah" },
  { value: "both", label: "Both" },
  { value: "guest", label: "Guest" },
];

interface FormState {
  title: string;
  description: string;
  cook: Cook;
  guestName: string;
  dateCooked: string;
  cuisine: string;
  prepMinutes: string;
  cookMinutes: string;
  servings: string;
  rating: number;
  makeAgain: boolean;
  notes: string;
  sourceUrl: string;
  ingredients: string; // textarea, one per line
  steps: string; // textarea, one per line
}

const EMPTY: FormState = {
  title: "",
  description: "",
  cook: "both",
  guestName: "",
  dateCooked: new Date().toISOString().slice(0, 10),
  cuisine: "",
  prepMinutes: "",
  cookMinutes: "",
  servings: "",
  rating: 0,
  makeAgain: false,
  notes: "",
  sourceUrl: "",
  ingredients: "",
  steps: "",
};

export function RecipeFormPage({ mode }: Props) {
  const navigate = useNavigate();
  const { slug = "" } = useParams();
  const { data: existing, isLoading } = useRecipe(mode === "edit" ? slug : "");

  const create = useCreateRecipe();
  const update = useUpdateRecipe();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [hero, setHero] = useState<CloudImage[]>([]);
  const [gallery, setGallery] = useState<CloudImage[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Hydrate the form when editing.
  useEffect(() => {
    if (mode === "edit" && existing) {
      setForm({
        title: existing.title,
        description: existing.description ?? "",
        cook: existing.cook,
        guestName: existing.guestName ?? "",
        dateCooked: existing.dateCooked.slice(0, 10),
        cuisine: existing.cuisine ?? "",
        prepMinutes: existing.prepMinutes?.toString() ?? "",
        cookMinutes: existing.cookMinutes?.toString() ?? "",
        servings: existing.servings?.toString() ?? "",
        rating: existing.rating ?? 0,
        makeAgain: existing.makeAgain,
        notes: existing.notes ?? "",
        sourceUrl: existing.sourceUrl ?? "",
        ingredients: existing.ingredients.join("\n"),
        steps: existing.steps.join("\n"),
      });
      setHero(existing.heroImage ? [existing.heroImage] : []);
      setGallery(existing.gallery);
      setTags(existing.tags);
    }
  }, [mode, existing]);

  const saving = create.isPending || update.isPending;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addTag(raw: string) {
    const t = raw.trim().toLowerCase().replace(/,$/, "");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft("");
  }

  function buildPayload(): RecipeInput {
    const lines = (s: string) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

    return {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      cook: form.cook,
      guestName: form.cook === "guest" ? form.guestName.trim() || undefined : undefined,
      dateCooked: form.dateCooked,
      heroImage: hero[0],
      gallery,
      ingredients: lines(form.ingredients),
      steps: lines(form.steps),
      tags,
      cuisine: form.cuisine.trim() || undefined,
      prepMinutes: num(form.prepMinutes),
      cookMinutes: num(form.cookMinutes),
      servings: num(form.servings),
      rating: form.rating || undefined,
      makeAgain: form.makeAgain,
      notes: form.notes.trim() || undefined,
      sourceUrl: form.sourceUrl.trim() || undefined,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);
    const payload = buildPayload();
    try {
      if (mode === "create") {
        const recipe = await create.mutateAsync(payload);
        navigate(`/recipe/${recipe.slug}`);
      } else if (existing) {
        const recipe = await update.mutateAsync({ id: existing._id, input: payload });
        navigate(`/recipe/${recipe.slug}`);
      }
    } catch (err) {
      // Surface per-field validation errors when present.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fields = (err as any)?.response?.data?.fields;
      if (fields) setFieldErrors(fields);
      setSubmitError(errorMessage(err));
    }
  }

  const heading = mode === "create" ? "Add a recipe" : "Edit recipe";

  if (mode === "edit" && isLoading) {
    return <p className="font-hand text-2xl text-muted">loading the recipe…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">{heading}</h1>

      <Field label="Title" error={fieldErrors.title}>
        <input
          className="field"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="What did you make?"
          required
        />
      </Field>

      <Field label="One-line teaser">
        <input
          className="field"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="A sentence to tempt a friend"
        />
      </Field>

      {/* Cook selector */}
      <div>
        <span className="label">Who made it?</span>
        <div className="flex flex-wrap gap-2">
          {COOKS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => set("cook", c.value)}
              className={`chip ${form.cook === c.value ? "chip-active" : ""}`}
              aria-pressed={form.cook === c.value}
            >
              {c.label}
            </button>
          ))}
        </div>
        {form.cook === "guest" && (
          <div className="mt-3">
            <Field label="Guest's name" error={fieldErrors.guestName}>
              <input
                className="field"
                value={form.guestName}
                onChange={(e) => set("guestName", e.target.value)}
                placeholder="e.g. Aunt May"
              />
            </Field>
          </div>
        )}
      </div>

      <ImageUploader label="Hero photo" mode="single" value={hero} onChange={setHero} />

      <Field label="Date cooked" error={fieldErrors.dateCooked}>
        <input
          type="date"
          className="field"
          value={form.dateCooked}
          onChange={(e) => set("dateCooked", e.target.value)}
          required
        />
      </Field>

      <Field label="Ingredients (one per line)" error={fieldErrors.ingredients}>
        <textarea
          className="field min-h-32"
          value={form.ingredients}
          onChange={(e) => set("ingredients", e.target.value)}
          placeholder={"200g spaghetti\n6 cloves garlic\n…"}
        />
      </Field>

      <Field label="Steps (one per line)" error={fieldErrors.steps}>
        <textarea
          className="field min-h-32"
          value={form.steps}
          onChange={(e) => set("steps", e.target.value)}
          placeholder={"Boil the pasta\nFry the garlic\n…"}
        />
      </Field>

      {/* Tags */}
      <div>
        <span className="label">Tags</span>
        {tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTags(tags.filter((x) => x !== t))}
                className="chip chip-active"
              >
                #{t} ✕
              </button>
            ))}
          </div>
        )}
        <input
          className="field"
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(tagDraft);
            }
          }}
          onBlur={() => tagDraft && addTag(tagDraft)}
          placeholder="Type a tag, press Enter (e.g. pasta, weeknight)"
        />
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Cuisine">
          <input className="field" value={form.cuisine} onChange={(e) => set("cuisine", e.target.value)} />
        </Field>
        <Field label="Prep (min)">
          <input
            type="number"
            min={0}
            className="field"
            value={form.prepMinutes}
            onChange={(e) => set("prepMinutes", e.target.value)}
          />
        </Field>
        <Field label="Cook (min)">
          <input
            type="number"
            min={0}
            className="field"
            value={form.cookMinutes}
            onChange={(e) => set("cookMinutes", e.target.value)}
          />
        </Field>
        <Field label="Servings">
          <input
            type="number"
            min={0}
            className="field"
            value={form.servings}
            onChange={(e) => set("servings", e.target.value)}
          />
        </Field>
      </div>

      {/* Rating + make again */}
      <div className="flex flex-wrap items-center gap-8">
        <div>
          <span className="label">Our rating</span>
          <StarRating value={form.rating} size="md" onChange={(v) => set("rating", v)} />
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={form.makeAgain}
            onChange={(e) => set("makeAgain", e.target.checked)}
            className="h-4 w-4 accent-berry"
          />
          <span className="font-body text-sm font-semibold">
            <span className="text-berry">♥</span> We'd make this again
          </span>
        </label>
      </div>

      <Field label="Notes (tweaks, commentary)">
        <textarea
          className="field min-h-24"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Add more garlic. Always more garlic."
        />
      </Field>

      <Field label="Source URL (if adapted)" error={fieldErrors.sourceUrl}>
        <input
          className="field"
          value={form.sourceUrl}
          onChange={(e) => set("sourceUrl", e.target.value)}
          placeholder="https://…"
        />
      </Field>

      {submitError && (
        <p className="rounded-lg border border-berry/40 bg-berry/10 px-3 py-2 text-sm text-berry">
          {submitError}
        </p>
      )}

      <div className="flex gap-3 pb-4">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save recipe"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Wrapping label associates the control without needing matching ids. */}
      <label className="block">
        <span className="label">{label}</span>
        {children}
      </label>
      {error && <p className="mt-1 text-sm text-berry">{error}</p>}
    </div>
  );
}
