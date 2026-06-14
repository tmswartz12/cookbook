import { lazy, Suspense, type ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { useAuth } from "./components/AuthProvider";
import { GalleryPage } from "./pages/GalleryPage";

// Code-split the routes a visitor doesn't need on first paint (keeps the
// gallery launch light; the form route also pulls in the image uploader).
const RecipePage = lazy(() =>
  import("./pages/RecipePage").then((m) => ({ default: m.RecipePage })),
);
const RecipeFormPage = lazy(() =>
  import("./pages/RecipeFormPage").then((m) => ({ default: m.RecipeFormPage })),
);
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

/** Editor-only route guard: viewers (or logged-out) are redirected home. */
function RequireEditor({ children }: { children: ReactElement }) {
  const { isEditor, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  return isEditor ? children : <Navigate to="/" replace />;
}

function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted" aria-busy="true">
      <span className="font-hand text-2xl">one sec…</span>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50
          focus:rounded-full focus:bg-herb focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <Header />
      <main
        id="main"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10"
      >
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/" element={<GalleryPage />} />
            <Route path="/recipe/:slug" element={<RecipePage />} />
            <Route
              path="/new"
              element={
                <RequireEditor>
                  <RecipeFormPage mode="create" />
                </RequireEditor>
              }
            />
            <Route
              path="/recipe/:slug/edit"
              element={
                <RequireEditor>
                  <RecipeFormPage mode="edit" />
                </RequireEditor>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="border-t border-line py-6 text-center font-hand text-lg text-muted">
        cooked with love · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
