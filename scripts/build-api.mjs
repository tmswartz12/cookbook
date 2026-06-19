// Bundle the Express serverless function into a single self-contained CJS file
// so Vercel's Node runtime can load it without ESM/extension resolution issues.
// Source lives in server/; the bundle is emitted to api/index.js (the function
// Vercel serves). api/package.json marks the dir as CommonJS. vercel.json
// rewrites every /api/* path (any depth) to this single function.
import { build } from "esbuild";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

mkdirSync("api", { recursive: true });

await build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  // Resolve the @shared/* path alias for runtime (non-type) imports. Type-only
  // imports get stripped, but server/routes/og.ts pulls in runtime values.
  alias: { "@shared": join(root, "shared") },
  // Single function; vercel.json rewrites every /api/* path (any depth) to it,
  // and the Express app routes internally on the original url. (A bracketed
  // [...path].js catch-all is NOT used: without a framework that expands it,
  // Vercel registers it as a single dynamic segment, so /api/auth/me and other
  // multi-segment paths 404 at the platform before reaching the function.)
  outfile: "api/index.js",
  packages: "external", // Vercel installs node_modules; don't inline them
  logLevel: "info",
  // Make module.exports itself the Express app (a callable (req,res) handler),
  // while keeping `.default` for runtimes that look there. Covers both the
  // Vercel Node runtime's default-export detection and direct invocation.
  footer: {
    js: "if (module.exports && module.exports.default) { const d = module.exports.default; module.exports = d; module.exports.default = d; }",
  },
});

// Ensure the emitted .js is treated as CommonJS even though the root is ESM.
writeFileSync("api/package.json", JSON.stringify({ type: "commonjs" }, null, 2) + "\n");

// Copy the built SPA shell next to the function so the OG route (server/routes/
// og.ts) can read it and inject per-recipe <head> tags for link unfurls. Built
// by `vite build`, which runs before this step in `npm run build`.
try {
  copyFileSync(join(root, "dist", "index.html"), join(root, "api", "index.html"));
  console.log("Copied dist/index.html → api/index.html (OG shell)");
} catch {
  console.warn("WARN: dist/index.html not found — OG unfurl route will fall back to the SPA.");
}

console.log("API bundled → api/index.js (CommonJS)");
