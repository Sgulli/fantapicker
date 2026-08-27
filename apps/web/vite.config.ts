import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
      "@fantapicker/shared": resolve(
        import.meta.dirname,
        "../../packages/shared/src/index.ts",
      ),
    },
    dedupe: ["zod"],
  },
  optimizeDeps: {
    include: ["zod", "zod/mini"],
  },
  build: {
    chunkSizeWarningLimit: 600,
  },
  server: {
    proxy: {
      "/api": "http://localhost:3001",
      "/health": "http://localhost:3001",
    },
  },
});
