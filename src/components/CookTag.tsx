import type { Cook } from "@shared/types";

interface Props {
  cook: Cook;
  guestName?: string;
  className?: string;
}

/** The signature handwritten "made by …" attribution. */
export function CookTag({ cook, guestName, className }: Props) {
  return (
    <span className={`font-hand text-xl leading-none text-herbsoft ${className ?? ""}`}>
      made by {cookLabel(cook, guestName)}
    </span>
  );
}

export function cookLabel(cook: Cook, guestName?: string): string {
  switch (cook) {
    case "tyler":
      return "Tyler";
    case "sarah":
      return "Sarah";
    case "both":
      return "both of us";
    case "guest":
      return guestName?.trim() || "a guest";
  }
}
