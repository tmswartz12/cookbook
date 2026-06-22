import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Suggestion } from "@shared/types";
import {
  errorMessage,
  logout,
  postGoogleCredential,
  useDeleteSuggestion,
  useSetSuggestionCooked,
  useSuggestions,
} from "../api/client";
import { useAuth } from "../components/AuthProvider";
import { EmptyState } from "../components/EmptyState";

/**
 * Hidden editor area. There's no sign-in link anywhere in the UI — reaching
 * `/admin` (or `/login`, which redirects here) is how Tyler & Sarah get in.
 *  - Signed-out visitor → Google sign-in.
 *  - Signed-in editor    → suggestions dashboard + sign out.
 *  - Signed-in non-editor → gently sent home.
 */
export function AdminPage() {
  const { user, isEditor, isLoading } = useAuth();
  const navigate = useNavigate();

  // A signed-in viewer (not an allowlisted editor) has no business here.
  useEffect(() => {
    if (!isLoading && user && !isEditor) navigate("/", { replace: true });
  }, [isLoading, user, isEditor, navigate]);

  if (isLoading) {
    return <p className="py-10 text-center font-hand text-2xl text-muted">one sec…</p>;
  }

  if (!isEditor) return <AdminSignIn />;

  return <SuggestionsDashboard />;
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Google sign-in, shown when no editor is signed in. */
function AdminSignIn() {
  const qc = useQueryClient();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CLIENT_ID || !buttonRef.current) return;

    let cancelled = false;

    async function onCredential(response: GoogleCredentialResponse) {
      try {
        await postGoogleCredential(response.credential);
        // Refetch /me; AuthProvider re-renders AdminPage into the dashboard.
        await qc.invalidateQueries({ queryKey: ["me"] });
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      }
    }

    // GIS may load slightly after React mounts; poll briefly for the global.
    const timer = window.setInterval(() => {
      if (!window.google || !buttonRef.current) return;
      window.clearInterval(timer);
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID as string,
        callback: onCredential,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
      });
    }, 100);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [qc]);

  return (
    <section className="mx-auto max-w-md py-10 text-center">
      <p className="font-hand text-3xl text-saffron">welcome back, chef</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Sign in</h1>
      <p className="mt-3 text-muted">
        Tyler &amp; Sarah sign in to add and edit recipes. Everyone else can browse without an
        account — no sign-in needed.
      </p>

      <div className="mt-8 flex justify-center">
        {CLIENT_ID ? (
          <div ref={buttonRef} />
        ) : (
          <p className="rounded-lg border border-line bg-paper px-4 py-3 text-sm text-muted">
            Google sign-in isn't configured yet (missing <code>VITE_GOOGLE_CLIENT_ID</code>).
          </p>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-berry/40 bg-berry/10 px-3 py-2 text-sm text-berry">
          {error}
        </p>
      )}
    </section>
  );
}

/** Editor-only dashboard of recipe suggestions left by visitors. */
function SuggestionsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: suggestions, isLoading } = useSuggestions(true);

  const pending = suggestions?.filter((s) => !s.cooked) ?? [];
  const cooked = suggestions?.filter((s) => s.cooked) ?? [];

  async function handleLogout() {
    await logout();
    await qc.invalidateQueries({ queryKey: ["me"] });
    navigate("/");
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-hand text-3xl text-saffron">the suggestion box</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            Recipe suggestions
          </h1>
          <p className="mt-2 text-muted">
            Recipes friends want us to cook. Mark one as cooked once we've made it.
          </p>
          {user && <p className="mt-1 text-sm text-muted">Signed in as {user.email}</p>}
        </div>
        <button type="button" onClick={handleLogout} className="btn-secondary shrink-0">
          Sign out
        </button>
      </header>

      {isLoading ? (
        <p className="font-hand text-2xl text-muted">loading suggestions…</p>
      ) : (suggestions?.length ?? 0) === 0 ? (
        <EmptyState title="No suggestions yet" line="quiet in here" />
      ) : (
        <div className="space-y-8">
          <Group label="To cook" count={pending.length}>
            {pending.map((s) => (
              <SuggestionRow key={s._id} suggestion={s} />
            ))}
          </Group>

          {cooked.length > 0 && (
            <Group label="Cooked" count={cooked.length}>
              {cooked.map((s) => (
                <SuggestionRow key={s._id} suggestion={s} />
              ))}
            </Group>
          )}
        </div>
      )}
    </section>
  );
}

function Group({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div>
      <h2 className="mb-3 font-display text-xl font-semibold text-herb">
        {label} <span className="text-muted">· {count}</span>
      </h2>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function SuggestionRow({ suggestion: s }: { suggestion: Suggestion }) {
  const setCooked = useSetSuggestionCooked();
  const remove = useDeleteSuggestion();

  function handleDelete() {
    if (window.confirm(`Delete "${s.title}"? This can't be undone.`)) {
      remove.mutate(s._id);
    }
  }

  return (
    <li
      className={`rounded-card border border-line bg-paper p-4 shadow-card transition ${
        s.cooked ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-ink">
            {s.title}
            {s.cooked && (
              <span className="ml-2 rounded-full bg-herb px-2 py-0.5 align-middle text-xs font-semibold text-paper">
                cooked
              </span>
            )}
          </h3>
          <p className="text-sm text-muted">
            from <span className="font-semibold text-ink">{s.name}</span>
            {s.instagram && (
              <>
                {" · "}
                <a
                  href={`https://instagram.com/${s.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-herbsoft hover:underline"
                >
                  @{s.instagram}
                </a>
              </>
            )}
          </p>
          {s.description && <p className="mt-2 text-ink">{s.description}</p>}
          {s.sourceUrl && (
            <a
              href={s.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-herbsoft hover:underline"
            >
              View recipe ↗
            </a>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setCooked.mutate({ id: s._id, cooked: !s.cooked })}
            disabled={setCooked.isPending}
            className={s.cooked ? "btn-secondary" : "btn-primary"}
          >
            {s.cooked ? "Mark not cooked" : "Mark cooked"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={remove.isPending}
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-berry/10 hover:text-berry"
            aria-label={`Delete suggestion "${s.title}"`}
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>
    </li>
  );
}
