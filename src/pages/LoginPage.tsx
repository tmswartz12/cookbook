import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { errorMessage, postGoogleCredential } from "../api/client";
import { useAuth } from "../components/AuthProvider";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function LoginPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Head home.
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!CLIENT_ID || !buttonRef.current) return;

    let cancelled = false;

    async function onCredential(response: GoogleCredentialResponse) {
      try {
        await postGoogleCredential(response.credential);
        await qc.invalidateQueries({ queryKey: ["me"] });
        if (!cancelled) navigate("/", { replace: true });
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
  }, [navigate, qc]);

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
