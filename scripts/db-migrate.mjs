#!/usr/bin/env node
/**
 * Host entrypoint for JSON → PostgreSQL cutover.
 * Runs the TypeScript migrator via tsx (dev) or compiled dist (production).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const compiled = path.join(root, "dist", "scripts", "db-migrate.js");
const args = process.argv.slice(2);

function runNode(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: root,
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}

if (existsSync(compiled)) {
  runNode(compiled);
}

const tsxBin = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
if (existsSync(tsxBin)) {
  const result = spawnSync(
    process.execPath,
    [tsxBin, path.join(root, "scripts", "db-migrate.ts"), ...args],
    { cwd: root, stdio: "inherit" },
  );
  process.exit(result.status ?? 1);
}

console.error(
  "Could not run db-migrate: build the project (npm run build) or install devDependencies (tsx).",
);
process.exit(1);
