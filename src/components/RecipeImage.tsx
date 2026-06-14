import type { CloudImage } from "@shared/types";
import { cld } from "../api/cloudinary";

interface Props {
  image?: CloudImage;
  transform: string;
  alt: string;
  className?: string;
}

/**
 * Render a recipe image through a Cloudinary transform when possible, falling
 * back to the stored secure_url, and to a warm placeholder when there's no photo.
 */
export function RecipeImage({ image, transform, alt, className }: Props) {
  if (!image) return <NoPhoto className={className} />;

  const transformed = image.publicId ? cld(image.publicId, transform) : "";
  const src = transformed || image.url;
  if (!src) return <NoPhoto className={className} />;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`h-full w-full object-cover ${className ?? ""}`}
    />
  );
}

function NoPhoto({ className }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-line/40 ${className ?? ""}`}
      aria-hidden
    >
      <span className="font-hand text-2xl text-muted">no photo yet</span>
    </div>
  );
}
