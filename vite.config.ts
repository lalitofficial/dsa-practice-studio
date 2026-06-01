import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { devApiPlugin } from "./dev/apiPlugin";

// React SPA. In dev, `devApiPlugin` runs the /api serverless functions
// in-process so `npm run dev` is a full local environment (UI + API + Mongo +
// Clerk). In production Vercel runs the same /api handlers as functions.
export default defineConfig({
  plugins: [react(), tailwindcss(), devApiPlugin()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
