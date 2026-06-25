import { useCallback, useEffect, useMemo, useState } from "react";
import type { CloudImage } from "@shared/types";
import { cld, LIGHTBOX } from "../api/cloudinary";

interface Props {
  images: CloudImage[];
  startIndex?: number;
  alt: string;
  onClose: () => void;
}

/** Resolve a single image to its Cloudinary lightbox URL (falling back to the stored url). */
function srcFor(image: CloudImage): string {
  return (image.publicId ? cld(image.publicId, LIGHTBOX) : "") || image.url;
}

/**
 * Navigable image viewer. Closes on backdrop/Escape; arrows + ←/→ keys page
 * through the gallery and wrap at the ends.
 *
 * Paging stays smooth because we (1) preload the neighbouring images so the
 * next/previous photo is already cached when you click, and (2) fade each photo
 * in once it's decoded instead of hard-swapping — so a slow image never leaves
 * the previous one flashing on screen.
 */
export function Lightbox({ images, startIndex = 0, alt, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  // Indices whose image bytes have finished loading — drives the fade-in.
  const [loaded, setLoaded] = useState<Set<number>>(new Set());
  const count = images.length;

  const sources = useMemo(() => images.map(srcFor), [images]);

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  const markLoaded = useCallback(
    (i: number) => setLoaded((prev) => (prev.has(i) ? prev : new Set(prev).add(i))),
    [],
  );

  // Preload the neighbours so paging left/right shows an already-decoded image.
  useEffect(() => {
    if (count <= 1) return;
    [(index + 1) % count, (index - 1 + count) % count].forEach((i) => {
      const img = new Image();
      img.onload = () => markLoaded(i);
      img.src = sources[i];
    });
  }, [index, count, sources, markLoaded]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, go]);

  if (count === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — photo ${index + 1} of ${count}`}
      onClick={onClose}
    >
      {/* Stable frame: arrows + counter anchor to this box, so they don't jump as
          images of different aspect ratios load in. */}
      <div
        className="relative flex max-h-[88vh] max-w-full items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={index}
          src={sources[index]}
          alt={`${alt} (${index + 1}/${count})`}
          decoding="async"
          onLoad={() => markLoaded(index)}
          className={`max-h-[88vh] max-w-full rounded-lg shadow-lift transition-opacity duration-200 ${
            loaded.has(index) ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-paper text-herb shadow-card"
        aria-label="Close"
      >
        ✕
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-herb shadow-card sm:left-6"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-herb shadow-card sm:right-6"
            aria-label="Next photo"
          >
            ›
          </button>

          {/* Counter */}
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-paper/90 px-3 py-1 text-sm font-semibold text-herb shadow-card">
            {index + 1} / {count}
          </span>
        </>
      )}
    </div>
  );
}
