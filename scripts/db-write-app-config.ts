import { readFileSync, unlinkSync } from "node:fs";
import { closeDbPool, initDbPool, loadDbBootstrapConfig } from "../shared/core/db.js";
import { setDbDataMany } from "../shared/core/dbData.js";
import { APP_CONFIG_TABLE } from "../shared/core/moduleTable.js";

async function main(): Promise<void> {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: db-write-app-config.ts <path-to-json>");
    process.exit(1);
  }

  let rows: Record<string, unknown>;
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("root must be a JSON object");
    }
    rows = parsed as Record<string, unknown>;
  } catch (err) {
    console.error(`Could not read app config JSON: ${(err as Error).message}`);
    process.exit(1);
  }

  initDbPool(loadDbBootstrapConfig());
  try {
    await setDbDataMany(APP_CONFIG_TABLE, rows);
  } finally {
    await closeDbPool();
    try {
      unlinkSync(filePath);
    } catch {
      // temp file cleanup is best-effort
    }
  }
}

main().catch((err) => {
  console.error("Failed to write app_config:", err);
  process.exit(1);
});
