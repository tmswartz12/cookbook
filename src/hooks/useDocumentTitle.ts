import { useEffect } from "react";

/** Set document.title while this component is mounted, restoring the previous
 *  title on unmount. Pass null/undefined to leave the title untouched (e.g.
 *  while a recipe is still loading). */
export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
