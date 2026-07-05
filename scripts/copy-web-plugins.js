// Copies every shared/modules/*/web-plugin.json into dist/shared/modules/*/.
// `tsc` does not emit .json files; the web editor reads manifests from dist at runtime.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
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

const adminCss = join(root, "dist", "web-admin", "src", "ui", "css", "admin.css");
const adminJs = join(root, "dist", "web-admin", "src", "ui", "js", "admin.js");
if (!existsSync(adminCss)) {
  console.error(
    "[copy-web-plugins] admin.css missing; run npm run build:admin-assets.",
  );
  process.exit(1);
}
if (!existsSync(adminJs)) {
  console.error(
    "[copy-web-plugins] admin.js missing; run npm run build:admin-assets.",
  );
  process.exit(1);
}
console.log("[copy-web-plugins] Verified bundled admin.css and admin.js in dist.");
