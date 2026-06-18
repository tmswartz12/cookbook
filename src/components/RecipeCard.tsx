import { Link } from "react-router-dom";
import type { Recipe } from "@shared/types";
import { CARD_THUMB } from "../api/cloudinary";
import { RecipeImage } from "./RecipeImage";
import { StarRating } from "./StarRating";

/** A recipe card styled like a pinned/printed photo with a handwritten caption. */
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      to={`/recipe/${recipe.slug}`}
      className="group block rounded-card border border-line bg-paper p-3 shadow-card
        transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:-translate-y-0.5"
    >
      {/* Photo — the hero */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-line/40">
        <RecipeImage
          image={recipe.heroImage}
          transform={CARD_THUMB}
          alt={recipe.title}
          className="transition duration-500 group-hover:scale-[1.03]"
        />
        {recipe.makeAgain && (
          <span
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full
              bg-paper/90 text-berry shadow-card"
            title="We'd make this again"
            aria-label="We'd make this again"
          >
            ♥
          </span>
        )}
        {recipe.gallery.length > 0 && (
          <span
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full
              bg-ink/70 px-2 py-0.5 text-xs font-semibold text-paper"
            title={`${recipe.gallery.length + 1} photos`}
            aria-label={`${recipe.gallery.length + 1} photos`}
          >
            <span aria-hidden>▦</span> {recipe.gallery.length + 1}
          </span>
        )}
      </div>

      {/* Caption */}
      <div className="px-1 pb-1 pt-3">
        <h3 className="font-display text-xl font-semibold leading-tight text-herb">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{recipe.description}</p>
        )}

        <div className="mt-2 flex items-center gap-3">
          {typeof recipe.rating === "number" && <StarRating value={recipe.rating} />}
          {recipe.tags.length > 0 && (
            <span className="truncate text-xs text-muted">
              {recipe.tags.slice(0, 3).map((t) => `#${t}`).join("  ")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
