import { useRef, useState } from "react";
import type { CloudImage } from "@shared/types";
import { uploadImage } from "../api/upload";
import { cld, GALLERY_THUMB } from "../api/cloudinary";

interface Props {
  label: string;
  /** "single" → hero image; "multiple" → gallery. */
  mode: "single" | "multiple";
  value: CloudImage[];
  onChange: (images: CloudImage[]) => void;
}

export function ImageUploader({ label, mode, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const list = mode === "single" ? [files[0]] : Array.from(files);
      const uploaded: CloudImage[] = [];
      for (const file of list) {
        uploaded.push(await uploadImage(file));
      }
      onChange(mode === "single" ? uploaded.slice(0, 1) : [...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function preview(img: CloudImage): string {
    return (img.publicId && cld(img.publicId, GALLERY_THUMB)) || img.url;
  }

  return (
    <div>
      <span className="label">{label}</span>

      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {value.map((img, i) => (
            <div key={img.publicId || i} className="relative">
              <img
                src={preview(img)}
                alt=""
                className="h-24 w-24 rounded-lg border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-berry text-paper shadow-card"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={mode === "multiple"}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        id={`uploader-${label}`}
      />
      <label htmlFor={`uploader-${label}`} className="btn-secondary cursor-pointer">
        {busy ? "Uploading…" : mode === "single" ? "Choose a photo" : "Add photos"}
      </label>

      {error && <p className="mt-2 text-sm text-berry">{error}</p>}
    </div>
  );
}
