import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages project site is served under /<repo-name>/.
// Repo name is "focus" -> base "/focus/" for production builds. In dev we use
// "/" so the local server (and preview) serves cleanly at the root. Override
// the production base with VITE_BASE_PATH (e.g. "/" for a custom domain).
// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Treat an empty/whitespace VITE_BASE_PATH as unset. CI passes
  // `${{ vars.VITE_BASE_PATH }}`, which expands to "" when the repo variable is
  // undefined — `??` wouldn't catch that, so an empty value must fall back too.
  const envBase = process.env.VITE_BASE_PATH?.trim();
  const base = command === "build" ? envBase || "/focus/" : "/";

  return {
    base,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // Service worker + manifest are emitted relative to `base`, so the PWA
      // stays installable under the GitHub Pages subpath.
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        name: "Focus",
        short_name: "Focus",
        description:
          "Personal productivity & time-tracking — tasks, areas, projects, and a focus timer.",
        theme_color: "#f4f1ea",
        background_color: "#f4f1ea",
        display: "standalone",
        // Scope/start_url must include the base path on GitHub Pages.
        scope: base,
        start_url: base,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // SPA navigation fallback so deep links resolve to index.html.
        navigateFallback: `${base}index.html`,
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
    ],
  };
});
