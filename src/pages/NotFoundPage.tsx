import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="font-hand text-3xl text-saffron">hmm, nothing's cooking here</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 max-w-md text-muted">
        That recipe may have been moved or never existed. Let's head back to the kitchen.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to the cookbook
      </Link>
    </section>
  );
}
