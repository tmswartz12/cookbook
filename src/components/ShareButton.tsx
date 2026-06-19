import { useState } from "react";

interface Props {
  title: string; // share-sheet title
  text: string; // share-sheet body / fallback context
  url: string; // absolute URL to share
  className?: string;
}

type Status = "idle" | "copied" | "error";

/**
 * One-tap share. Uses the native share sheet (navigator.share) on supported
 * devices — phones, mostly — and falls back to copying the link to the
 * clipboard with a transient "Copied!" confirmation everywhere else.
 */
export function ShareButton({ title, text, url, className }: Props) {
  const [status, setStatus] = useState<Status>("idle");

  function flash(next: Status) {
    setStatus(next);
    window.setTimeout(() => setStatus("idle"), 2000);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      flash("copied");
    } catch {
      flash("error");
    }
  }

  async function handleShare() {
    // Prefer the native share sheet when available (and not the desktop no-op).
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User dismissed the sheet — not an error; just stop.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Anything else (unsupported payload, etc.) → fall back to copy.
      }
    }
    await copyLink();
  }

  const label =
    status === "copied" ? "Link copied!" : status === "error" ? "Couldn't copy" : "Share";

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`btn-secondary ${className ?? ""}`}
      aria-live="polite"
    >
      <span aria-hidden>{status === "copied" ? "✓" : "↗"}</span>
      {label}
    </button>
  );
}
