import type { Cook, RecipeSort } from "@shared/types";
import { useTags } from "../api/client";

export interface Filters {
  search: string;
  cook?: Cook;
  tag?: string;
  sort: RecipeSort;
}

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

const COOKS: { value: Cook; label: string }[] = [
  { value: "tyler", label: "Tyler" },
  { value: "sarah", label: "Sarah" },
  { value: "both", label: "Both" },
  { value: "guest", label: "Guests" },
];

const SORTS: { value: RecipeSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "rating", label: "Top rated" },
  { value: "title", label: "A–Z" },
];

export function FilterBar({ value, onChange }: Props) {
  const { data: tags = [] } = useTags();

  function patch(p: Partial<Filters>) {
    onChange({ ...value, ...p });
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Search + cook + sort row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search recipes</span>
          <input
            type="search"
            className="field pl-9"
            placeholder="Search recipes, ingredients, tags…"
            value={value.search}
            onChange={(e) => patch({ search: e.target.value })}
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
            ⌕
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cook filter */}
          <div className="flex flex-wrap gap-1.5">
            {COOKS.map((c) => {
              const active = value.cook === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => patch({ cook: active ? undefined : c.value })}
                  className={`chip ${active ? "chip-active" : ""}`}
                  aria-pressed={active}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <label className="ml-auto">
            <span className="sr-only">Sort recipes</span>
            <select
              className="field w-auto py-2"
              value={value.sort}
              onChange={(e) => patch({ sort: e.target.value as RecipeSort })}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Tag chips */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.tag && (
            <button type="button" onClick={() => patch({ tag: undefined })} className="chip chip-active">
              #{value.tag} ✕
            </button>
          )}
          {tags
            .filter((t) => t !== value.tag)
            .map((t) => (
              <button key={t} type="button" onClick={() => patch({ tag: t })} className="chip">
                #{t}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
