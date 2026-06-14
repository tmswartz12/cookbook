interface Props {
  value: number; // 1–5
  size?: "sm" | "md";
  /** When set, renders interactive buttons and reports the chosen value. */
  onChange?: (value: number) => void;
  className?: string;
}

const STARS = [1, 2, 3, 4, 5];

/** Saffron star rating — read-only display, or interactive when onChange is given. */
export function StarRating({ value, size = "sm", onChange, className }: Props) {
  const px = size === "sm" ? "text-base" : "text-2xl";
  const interactive = Boolean(onChange);

  if (!interactive) {
    return (
      <span
        className={`inline-flex items-center ${px} ${className ?? ""}`}
        aria-label={`Rated ${value} out of 5`}
        title={`${value}/5`}
      >
        {STARS.map((s) => (
          <span key={s} className={s <= value ? "text-saffron" : "text-line"} aria-hidden>
            ★
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 ${px} ${className ?? ""}`} role="group">
      {STARS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s === value ? 0 : s)}
          className={`leading-none transition ${s <= value ? "text-saffron" : "text-line hover:text-saffron/60"}`}
          aria-label={`${s} star${s > 1 ? "s" : ""}`}
          aria-pressed={s <= value}
        >
          ★
        </button>
      ))}
    </span>
  );
}
