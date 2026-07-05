import tailwindcss from "@tailwindcss/vite";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const webAdminRoot = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(webAdminRoot, "../dist/web-admin/src/ui");
const outCss = resolve(outDir, "css");
const outJs = resolve(outDir, "js");

export default defineConfig({
  root: webAdminRoot,
  plugins: [
    tailwindcss(),
    {
      name: "prepare-admin-asset-dirs",
      buildStart() {
        mkdirSync(outCss, { recursive: true });
        mkdirSync(outJs, { recursive: true });
        for (const stale of [
          "tabler.min.css",
          "admin-overrides.css",
          "admin2.css",
          "htmx.min.js",
        ]) {
          try {
            rmSync(resolve(outCss, stale));
          } catch {
            /* ignore */
          }
          try {
            rmSync(resolve(outJs, stale));
          } catch {
            /* ignore */
          }
        }
      },
    },
  ],
  build: {
    outDir,
    emptyOutDir: false,
    minify: "esbuild",
    cssMinify: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(webAdminRoot, "src/ui/assets/admin.ts"),
      output: {
        entryFileNames: "js/admin.js",
        assetFileNames: "css/admin.css",
      },
    },
  },
});
