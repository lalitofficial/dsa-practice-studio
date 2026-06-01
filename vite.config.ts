import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// React SPA. The /api directory is served by Vercel functions (use `vercel dev`
// locally so /api/* is available alongside the Vite dev server).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
