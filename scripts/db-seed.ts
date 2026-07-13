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
import { MODULE_SEED_DEFAULTS } from "./lib/moduleSeedDefaults.js";

async function seedModuleTable(
  namespace: ModuleNamespace,
  force: boolean,
): Promise<number> {
  const table = moduleTableName(namespace);
  if (!(await tableIsEmpty(table)) && !force) {
    return 0;
  }

  const rows = MODULE_SEED_DEFAULTS[namespace];

  await withTransaction(async (client) => {
    if (force) {
      await client.query(`DELETE FROM ${table}`);
    }
    for (const [key, value] of Object.entries(rows)) {
      await client.query(
        `INSERT INTO ${table} (key, value, updated_at)
         VALUES ($1, $2::jsonb, now())
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = now()`,
        [key, JSON.stringify(value)],
      );
    }
  });

  return Object.keys(rows).length;
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
