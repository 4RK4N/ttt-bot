import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  closeDbPool,
  initDbPool,
  loadDbBootstrapConfig,
  withTransaction,
} from "../shared/core/db.js";
import { tableIsEmpty } from "../shared/core/dbData.js";
import {
  APP_CONFIG_TABLE,
  MODULE_NAMESPACES,
  moduleTableName,
  type ModuleNamespace,
} from "../shared/core/moduleTable.js";
import { planModuleMigration } from "./lib/migrateJsonToDb.js";

const DATA_DIR = path.resolve(process.cwd(), "data");

function readJson(filePath: string): Record<string, unknown> {
  const raw = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Invalid JSON object in ${filePath}`);
  }
  return parsed as Record<string, unknown>;
}

function examplePath(namespace: string, kind: "config" | "texts"): string {
  return path.join(DATA_DIR, namespace, `${kind}.example.json`);
}

async function seedModuleTable(
  namespace: ModuleNamespace,
  force: boolean,
): Promise<number> {
  const table = moduleTableName(namespace);
  if (!(await tableIsEmpty(table)) && !force) {
    return 0;
  }

  const configFile = examplePath(namespace, "config");
  const textsFile = examplePath(namespace, "texts");
  if (!existsSync(configFile) && !existsSync(textsFile)) {
    console.warn(`[seed] No example JSON for module "${namespace}" — skipped.`);
    return 0;
  }

  const configData = existsSync(configFile) ? readJson(configFile) : {};
  const textsData = existsSync(textsFile) ? readJson(textsFile) : {};
  const plan = planModuleMigration(namespace, configData, textsData);

  await withTransaction(async (client) => {
    if (force) {
      await client.query(`DELETE FROM ${table}`);
    }
    for (const [key, value] of Object.entries(plan.rows)) {
      await client.query(
        `INSERT INTO ${table} (key, value, updated_at)
         VALUES ($1, $2::jsonb, now())
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = now()`,
        [key, JSON.stringify(value)],
      );
    }
  });

  return Object.keys(plan.rows).length;
}

export async function seedAllModuleTables(force: boolean): Promise<void> {
  initDbPool(loadDbBootstrapConfig());
  for (const namespace of MODULE_NAMESPACES) {
    const count = await seedModuleTable(namespace, force);
    if (count > 0) {
      console.log(`[seed] ${moduleTableName(namespace)}: ${count} key(s)`);
    }
  }
  await closeDbPool();
}

export async function printTableCounts(): Promise<void> {
  initDbPool(loadDbBootstrapConfig());
  const tables = [APP_CONFIG_TABLE, ...MODULE_NAMESPACES.map(moduleTableName)];
  for (const table of tables) {
    const pool = initDbPool();
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${table}`,
    );
    console.log(`${table}: ${result.rows[0]?.count ?? "0"} row(s)`);
  }
  await closeDbPool();
}

const force = process.argv.includes("--force");

seedAllModuleTables(force)
  .then(() => printTableCounts())
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
  });
