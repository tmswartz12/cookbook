import { useEffect } from "react";
import type { CloudImage } from "@shared/types";
import { cld, LIGHTBOX } from "../api/cloudinary";

interface Props {
  image: CloudImage;
  alt: string;
  onClose: () => void;
}

/** Simple modal image viewer. Closes on backdrop click or Escape. */
export function Lightbox({ image, alt, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const src = image.publicId ? cld(image.publicId, LIGHTBOX) || image.url : image.url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-full rounded-lg shadow-lift"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-paper text-herb shadow-card"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
