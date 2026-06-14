import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { CloudImage } from "@shared/types";
import { errorMessage, useDeleteRecipe, useRecipe } from "../api/client";
import { useAuth } from "../components/AuthProvider";
import { RecipeImage } from "../components/RecipeImage";
import { CookTag } from "../components/CookTag";
import { StarRating } from "../components/StarRating";
import { Lightbox } from "../components/Lightbox";
import { DETAIL_HERO, GALLERY_THUMB } from "../api/cloudinary";

export function RecipePage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { isEditor } = useAuth();
  const { data: recipe, isLoading, isError } = useRecipe(slug);
  const del = useDeleteRecipe();
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !recipe) {
    return (
      <div className="rounded-card border border-line bg-paper p-10 text-center">
        <p className="font-hand text-2xl text-berry">we couldn't find that recipe</p>
        <Link to="/" className="btn-secondary mt-4">
          Back to the cookbook
        </Link>
      </div>
    );
  }

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function handleDelete() {
    if (!recipe) return;
    const ok = window.confirm(`Delete "${recipe.title}"? This also removes its photos and can't be undone.`);
    if (!ok) return;
    try {
      await del.mutateAsync(recipe._id);
      navigate("/");
    } catch (err) {
      window.alert(errorMessage(err));
    }
  }

  const meta = buildMeta(recipe.dateCooked, recipe.prepMinutes, recipe.cookMinutes, recipe.servings);

  // The full browsable photo set: hero first, then any gallery shots.
  const photos = [recipe.heroImage, ...recipe.gallery].filter(Boolean) as CloudImage[];

  return (
    <article className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="overflow-hidden rounded-card border border-line bg-paper shadow-card">
        {recipe.heroImage ? (
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="block aspect-[16/10] w-full"
            aria-label="View photo full size"
          >
            <RecipeImage image={recipe.heroImage} transform={DETAIL_HERO} alt={recipe.title} />
          </button>
        ) : (
          <div className="aspect-[16/10] w-full">
            <RecipeImage image={recipe.heroImage} transform={DETAIL_HERO} alt={recipe.title} />
          </div>
        )}
      </div>

      {/* Title block */}
      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <CookTag cook={recipe.cook} guestName={recipe.guestName} />
          {recipe.makeAgain && (
            <span className="inline-flex items-center gap-1 text-berry" title="We'd make this again">
              ♥ <span className="text-sm font-semibold">we'd make this again</span>
            </span>
          )}
        </div>
        <h1 className="mt-1 font-display text-4xl font-semibold leading-tight">{recipe.title}</h1>
        {recipe.description && <p className="mt-2 text-lg text-muted">{recipe.description}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {meta.map((m) => (
            <span key={m}>{m}</span>
          ))}
          {typeof recipe.rating === "number" && <StarRating value={recipe.rating} />}
        </div>

        {recipe.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {recipe.tags.map((t) => (
              <span key={t} className="chip">
                #{t}
              </span>
            ))}
          </div>
        )}

        {isEditor && (
          <div className="mt-4 flex gap-2">
            <Link to={`/recipe/${recipe.slug}/edit`} className="btn-secondary">
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="btn-danger"
              disabled={del.isPending}
            >
              {del.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.4fr]">
        {/* Ingredients */}
        <section>
          <h2 className="font-display text-2xl font-semibold">Ingredients</h2>
          <ul className="mt-3 space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-2 text-ink">
                  <input
                    type="checkbox"
                    checked={checked.has(i)}
                    onChange={() => toggle(i)}
                    className="mt-1 h-4 w-4 accent-herb"
                  />
                  <span className={checked.has(i) ? "text-muted line-through" : ""}>{ing}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* Steps */}
        <section>
          <h2 className="font-display text-2xl font-semibold">Steps</h2>
          <ol className="mt-3 space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-herb font-body text-sm font-semibold text-paper">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Notes — handwritten callout */}
      {recipe.notes && (
        <aside className="mt-8 rounded-card border border-saffron/40 bg-saffron/10 p-5">
          <p className="font-hand text-xl text-herbsoft">our notes</p>
          <p className="mt-1 font-hand text-2xl leading-snug text-ink">{recipe.notes}</p>
        </aside>
      )}

      {/* Source */}
      {recipe.sourceUrl && (
        <p className="mt-6 text-sm text-muted">
          Adapted from{" "}
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-herbsoft underline"
          >
            the original
          </a>
          .
        </p>
      )}

      {/* Gallery */}
      {recipe.gallery.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-semibold">More shots</h2>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {recipe.gallery.map((img, i) => {
              // Index into `photos` — hero (if any) occupies slot 0.
              const photoIndex = recipe.heroImage ? i + 1 : i;
              return (
                <button
                  key={img.publicId}
                  type="button"
                  onClick={() => setLightboxIndex(photoIndex)}
                  className="aspect-square overflow-hidden rounded-lg border border-line transition hover:opacity-90"
                >
                  <RecipeImage image={img} transform={GALLERY_THUMB} alt={recipe.title} />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {lightboxIndex !== null && photos.length > 0 && (
        <Lightbox
          images={photos}
          startIndex={lightboxIndex}
          alt={recipe.title}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  );
}

function buildMeta(
  dateCooked: string,
  prep?: number,
  cook?: number,
  servings?: number,
): string[] {
  const out: string[] = [];
  const d = new Date(dateCooked);
  if (!Number.isNaN(d.getTime())) {
    out.push(
      `Cooked ${d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`,
    );
  }
  const time = (prep ?? 0) + (cook ?? 0);
  if (time > 0) out.push(`${time} min`);
  if (servings) out.push(`Serves ${servings}`);
  return out;
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl" aria-hidden>
      <div className="aspect-[16/10] w-full animate-pulse rounded-card bg-line/60" />
      <div className="mt-5 h-9 w-2/3 animate-pulse rounded bg-line/60" />
      <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-line/50" />
    </div>
  );
}
