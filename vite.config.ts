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
    target: "es2022",
    // Split big dependencies into their own cached chunks. CodeMirror/dockview
    // only load with the problem page (lazy route); react/clerk load at start.
    // Separate hashes mean app-code changes don't bust vendor caches.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // CodeMirror + its lezer/marijn deps (only used by the problem page).
          if (/@codemirror|codemirror|@uiw|@lezer|@marijn|style-mod|crelt|w3c-keyname/.test(id))
            return "codemirror";
          if (id.includes("dockview")) return "dockview";
          if (id.includes("@clerk")) return "clerk";
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id))
            return "react";
          if (/perfect-freehand|marked|dompurify/.test(id)) return "notes-vendor";
          if (id.includes("@tanstack")) return "query";
          // Everything else: let Rollup co-locate with the chunk that imports it.
        },
      },
    },
  },
});
