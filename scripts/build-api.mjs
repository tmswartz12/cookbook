// Bundle the Express serverless function into a single self-contained CJS file
// so Vercel's Node runtime can load it without ESM/extension resolution issues.
// Source lives in server/; the bundle is emitted to api/index.js (the function
// Vercel serves). api/package.json marks the dir as CommonJS. vercel.json
// rewrites every /api/* path (any depth) to this single function.
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("api", { recursive: true });

await build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
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

console.log("API bundled → api/index.js (CommonJS)");
