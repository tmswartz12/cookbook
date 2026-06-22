import { useEffect, useState, type FormEvent } from "react";
import type { SuggestionInput } from "@shared/types";
import { errorMessage, useSubmitSuggestion } from "../api/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  name: string;
  title: string;
  description: string;
  instagram: string;
  sourceUrl: string;
}

const EMPTY: FormState = {
  name: "",
  title: "",
  description: "",
  instagram: "",
  sourceUrl: "",
};

/**
 * Slide-in panel (like a checkout) for suggesting a recipe. Public — no sign-in
 * needed. Closes on backdrop click / Escape; locks page scroll while open.
 */
export function SuggestRecipeDrawer({ open, onClose }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const submit = useSubmitSuggestion();

  // Reset the form each time the drawer opens, and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setFieldErrors({});
    setSubmitError(null);
    setDone(false);
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);
    const payload: SuggestionInput = {
      name: form.name.trim(),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      instagram: form.instagram.trim().replace(/^@+/, "") || undefined,
      sourceUrl: form.sourceUrl.trim() || undefined,
    };
    try {
      await submit.mutateAsync(payload);
      setDone(true);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fields = (err as any)?.response?.data?.fields;
      if (fields) setFieldErrors(fields);
      setSubmitError(errorMessage(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/60"
      role="dialog"
      aria-modal="true"
      aria-label="Suggest a recipe"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-md animate-[slidein_0.2s_ease-out] flex-col overflow-y-auto
          bg-butter shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="font-hand text-2xl text-saffron">got a recipe for us?</p>
            <h2 className="font-display text-2xl font-semibold text-herb">Suggest a recipe</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-herb shadow-card"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <p className="font-hand text-4xl text-saffron">yum — thank you!</p>
            <p className="mt-3 text-muted">
              We got your suggestion. We'll take a look and maybe cook it up soon.
            </p>
            <button type="button" className="btn-primary mt-8" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 px-5 py-6 sm:px-6">
            <Field label="Your name" error={fieldErrors.name}>
              <input
                className="field"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Who's suggesting?"
                required
                autoFocus
              />
            </Field>

            <Field label="Recipe" error={fieldErrors.title}>
              <input
                className="field"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="What should we make?"
                required
              />
            </Field>

            <Field label="Why this one? (optional)" error={fieldErrors.description}>
              <textarea
                className="field min-h-24"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="A line on why you love it"
              />
            </Field>

            <Field label="Instagram (optional)" error={fieldErrors.instagram}>
              <div className="flex items-center gap-2">
                <span className="font-body text-lg text-muted">@</span>
                <input
                  className="field"
                  value={form.instagram}
                  onChange={(e) => set("instagram", e.target.value)}
                  placeholder="your handle"
                />
              </div>
            </Field>

            <Field label="Link to the recipe (optional)" error={fieldErrors.sourceUrl}>
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

            <div className="mt-auto flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={submit.isPending}>
                {submit.isPending ? "Sending…" : "Send suggestion"}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
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
      <label className="block">
        <span className="label">{label}</span>
        {children}
      </label>
      {error && <p className="mt-1 text-sm text-berry">{error}</p>}
    </div>
  );
}
