// Bundle the Express serverless function into a single self-contained CJS file
// so Vercel's Node runtime can load it without ESM/extension resolution issues.
// Source lives in server/; the bundle is emitted to api/index.js (the function
// Vercel serves). api/package.json marks the dir as CommonJS.
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("api", { recursive: true });

await build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  // Catch-all function: matches every /api/* path and receives the ORIGINAL
  // url (e.g. /api/recipes), which the Express app routes internally. A plain
  // api/index.js would only match /api/index.
  outfile: "api/[...path].js",
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

console.log("API bundled → api/[...path].js (CommonJS catch-all)");
