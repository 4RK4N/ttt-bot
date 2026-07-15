import tailwindcss from "@tailwindcss/vite";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const webAdminRoot = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(webAdminRoot, "../dist/web-admin/src/ui");
const outCss = resolve(outDir, "css");

export default defineConfig({
  root: webAdminRoot,
  plugins: [
    tailwindcss(),
    {
      name: "prepare-admin-css-dir",
      buildStart() {
        mkdirSync(outCss, { recursive: true });
        for (const stale of [
          "tabler.min.css",
          "admin-overrides.css",
          "admin.css",
          "admin2.css",
          "admin-styles.js",
        ]) {
          try {
            rmSync(resolve(outCss, stale));
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
      input: resolve(webAdminRoot, "src/ui/assets/admin-styles.ts"),
      output: {
        assetFileNames: "css/admin.min.css",
        entryFileNames: "css/[name].js",
      },
    },
  },
});
