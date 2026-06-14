import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthProvider";
import { logout } from "../api/client";

export function Header() {
  const { user, isEditor } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleLogout() {
    await logout();
    await qc.invalidateQueries({ queryKey: ["me"] });
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-herbsoft/40 bg-herb text-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex flex-col leading-none">
          <span className="font-hand text-xl text-saffron sm:text-2xl">made by</span>
          <span className="-mt-1 font-display text-2xl font-semibold sm:text-3xl">
            Tyler &amp; Sarah
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {isEditor && (
            <Link to="/new" className="btn-primary bg-saffron text-herb hover:bg-saffron/90">
              <span aria-hidden>＋</span> Add recipe
            </Link>
          )}

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full px-3 py-2 text-sm font-semibold text-paper/90 hover:text-paper"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full px-3 py-2 text-sm font-semibold text-paper/90 hover:text-paper"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
