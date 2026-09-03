import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  // @forma/shared is a workspace package resolved straight to its built
  // source (packages/shared/dist), not a real published npm dependency —
  // esbuild's dependency-scan step can still try to pre-bundle it like one,
  // and on some setups (most visibly Windows, via npm's symlinked
  // workspace node_modules) that scan runs against a stale cached snapshot
  // before the freshly-built dist is picked up, producing a spurious
  // "No matching export" error on the very first `vite dev` run. Excluding
  // it here skips that pre-bundle step entirely — Vite serves it straight
  // from its own module graph instead, which is both correct and faster
  // for a local workspace package.
  optimizeDeps: {
    exclude: ["@forma/shared"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
