// Copies every shared/modules/*/web-plugin.json into dist/shared/modules/*/.
// `tsc` does not emit .json files; the web editor reads manifests from dist at runtime.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcModules = join(root, "shared", "modules");
const distModules = join(root, "dist", "shared", "modules");

if (!existsSync(srcModules)) {
  console.warn(
    "[copy-web-plugins] No shared/modules directory; nothing to copy.",
  );
  process.exit(0);
}

let copied = 0;
for (const entry of readdirSync(srcModules, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const manifest = join(srcModules, entry.name, "web-plugin.json");
  if (!existsSync(manifest)) continue;

  const destDir = join(distModules, entry.name);
  mkdirSync(destDir, { recursive: true });
  cpSync(manifest, join(destDir, "web-plugin.json"));
  copied++;
}

console.log(
  `[copy-web-plugins] Copied ${copied} web-plugin.json manifest(s) into dist.`,
);

const adminCss = join(
  root,
  "dist",
  "web-admin",
  "src",
  "ui",
  "css",
  "admin.min.css",
);
const adminJs = join(
  root,
  "dist",
  "web-admin",
  "src",
  "ui",
  "js",
  "admin.min.js",
);
if (!existsSync(adminCss)) {
  console.error(
    "[copy-web-plugins] admin.min.css missing; run npm run build:admin-assets.",
  );
  process.exit(1);
}
if (!existsSync(adminJs)) {
  console.error(
    "[copy-web-plugins] admin.min.js missing; run npm run build:admin-assets.",
  );
  process.exit(1);
}

const adminJsDest = join(root, "dist", "web-admin", "src", "ui", "js");
mkdirSync(adminJsDest, { recursive: true });
const htmxSrc = join(root, "node_modules", "htmx.org", "dist", "htmx.min.js");
if (!existsSync(htmxSrc)) {
  console.error("[copy-web-plugins] Missing htmx.org. Run npm install.");
  process.exit(1);
}
cpSync(htmxSrc, join(adminJsDest, "htmx.min.js"));
if (!existsSync(join(adminJsDest, "htmx.min.js"))) {
  console.error("[copy-web-plugins] htmx.min.js missing after copy.");
  process.exit(1);
}

const adminCssDir = join(root, "dist", "web-admin", "src", "ui", "css");
for (const stray of ["admin-styles.js", "admin.css", "admin2.css"]) {
  try {
    rmSync(join(adminCssDir, stray));
  } catch {
    /* ignore */
  }
}
for (const stray of ["admin.js"]) {
  try {
    rmSync(join(adminJsDest, stray));
  } catch {
    /* ignore */
  }
}

console.log(
  "[copy-web-plugins] Verified admin.min.css, admin.min.js, and htmx.min.js in dist.",
);
