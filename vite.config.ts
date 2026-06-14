import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// The frontend is a static SPA. In production (Vercel) the Express app in `api/`
// is served as a serverless function at /api — no proxy needed there.
// For plain `vite dev` (no Vercel CLI) we proxy /api to a local Express runner.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query", "axios"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
