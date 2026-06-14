import { useMemo, useState } from "react";
import { useInfiniteRecipes } from "../api/client";
import { useAuth } from "../components/AuthProvider";
import { useDebounced } from "../hooks/useDebounced";
import { RecipeCard } from "../components/RecipeCard";
import { CardGridSkeleton } from "../components/CardSkeleton";
import { EmptyState } from "../components/EmptyState";
import { FilterBar, type Filters } from "../components/FilterBar";

const DEFAULT_FILTERS: Filters = { search: "", sort: "newest" };

export function GalleryPage() {
  const { isEditor } = useAuth();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const debouncedSearch = useDebounced(filters.search, 300);

  // Query key uses the debounced search so typing doesn't fire a request per keystroke.
  const query = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      cook: filters.cook,
      tag: filters.tag,
      sort: filters.sort,
      limit: 24,
    }),
    [debouncedSearch, filters.cook, filters.tag, filters.sort],
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteRecipes(query);

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const isFiltered =
    Boolean(debouncedSearch) || Boolean(filters.cook) || Boolean(filters.tag);

  return (
    <section>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Our cookbook</h1>
        <p className="mt-1 font-hand text-2xl text-muted">everything we've cooked, with photos</p>
      </div>

      <FilterBar value={filters} onChange={setFilters} />

      {isLoading && <CardGridSkeleton />}

      {isError && (
        <div className="rounded-card border border-line bg-paper p-8 text-center">
          <p className="font-hand text-2xl text-berry">that didn't load</p>
          <p className="mt-2 text-muted">
            We couldn't reach the kitchen just now. Check your connection and try again.
          </p>
          <button type="button" onClick={() => refetch()} className="btn-secondary mt-4">
            Try again
          </button>
        </div>
      )}

      {data && items.length === 0 && (
        <EmptyState
          line={isFiltered ? "Nothing matches that —" : "No recipes yet —"}
          title={
            isFiltered ? "Try a different search or filter." : "Cook something and add the first one."
          }
          action={
            !isFiltered && isEditor ? { to: "/new", label: "Add the first recipe" } : undefined
          }
        />
      )}

      {items.length > 0 && (
        <>
          <p className="mb-3 text-sm text-muted">
            {total} {total === 1 ? "recipe" : "recipes"}
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="btn-secondary"
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
