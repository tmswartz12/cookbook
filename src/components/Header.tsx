import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { SuggestRecipeDrawer } from "./SuggestRecipeDrawer";

export function Header() {
  const { isEditor } = useAuth();
  const [suggestOpen, setSuggestOpen] = useState(false);

  return (
    <>
    <header className="sticky top-0 z-20 border-b border-herbsoft/40 bg-herb text-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex flex-col leading-none">
          <span className="font-hand text-xl text-saffron sm:text-2xl">made by</span>
          <span className="-mt-1 font-display text-2xl font-semibold sm:text-3xl">
            Tyler &amp; Sarah
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSuggestOpen(true)}
            className="rounded-full border border-paper/30 px-3 py-2 text-sm font-semibold
              text-paper/90 transition hover:border-paper/60 hover:text-paper"
          >
            <span aria-hidden>✎</span> Suggest a recipe
          </button>

          {isEditor && (
            <Link to="/new" className="btn-primary bg-saffron text-herb hover:bg-saffron/90">
              <span aria-hidden>＋</span> Add recipe
            </Link>
          )}
        </nav>
      </div>
    </header>
    <SuggestRecipeDrawer open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </>
  );
}
