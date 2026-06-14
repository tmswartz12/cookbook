/** Slugify a title: lowercase, strip accents, non-alnum → hyphens. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Short random suffix to disambiguate slug collisions, e.g. "-a1b2". */
export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

/** Normalize tags: trim, lowercase, drop empties, de-dupe (order preserved). */
export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().toLowerCase();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}
