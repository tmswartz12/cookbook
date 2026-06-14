import { useCallback, useEffect, useState } from "react";
import type { CloudImage } from "@shared/types";
import { cld, LIGHTBOX } from "../api/cloudinary";

interface Props {
  images: CloudImage[];
  startIndex?: number;
  alt: string;
  onClose: () => void;
}

/**
 * Navigable image viewer. Closes on backdrop/Escape; arrows + ←/→ keys page
 * through the gallery. Wraps around at the ends.
 */
export function Lightbox({ images, startIndex = 0, alt, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const count = images.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

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
  const image = images[index];
  const src = image.publicId ? cld(image.publicId, LIGHTBOX) || image.url : image.url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — photo ${index + 1} of ${count}`}
      onClick={onClose}
    >
      {/* Image */}
      <img
        src={src}
        alt={`${alt} (${index + 1}/${count})`}
        className="max-h-[88vh] max-w-full rounded-lg shadow-lift"
        onClick={(e) => e.stopPropagation()}
      />

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
