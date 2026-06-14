/** Loading placeholder shaped like a RecipeCard. */
export function CardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-paper p-3 shadow-card" aria-hidden>
      <div className="aspect-[4/3] animate-pulse rounded-[10px] bg-line/60" />
      <div className="px-1 pb-1 pt-3">
        <div className="h-4 w-24 animate-pulse rounded bg-line/60" />
        <div className="mt-2 h-5 w-3/4 animate-pulse rounded bg-line/60" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-line/50" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
