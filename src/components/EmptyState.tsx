import { Link } from "react-router-dom";

interface Props {
  title: string;
  line: string;
  /** Optional call-to-action (shown to editors on the gallery, etc.). */
  action?: { to: string; label: string };
}

export function EmptyState({ title, line, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-paper/60 px-6 py-16 text-center">
      <p className="font-hand text-3xl text-saffron">{line}</p>
      <h2 className="mt-2 font-display text-2xl font-semibold">{title}</h2>
      {action && (
        <Link to={action.to} className="btn-primary mt-6">
          {action.label}
        </Link>
      )}
    </div>
  );
}
