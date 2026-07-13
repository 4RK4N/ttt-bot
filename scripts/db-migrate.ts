import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type pg from "pg";
import {
  closeDbPool,
  getDbPool,
  initDbPool,
  loadDbBootstrapConfig,
  withTransaction,
} from "../shared/core/db.js";
import { tableIsEmpty } from "../shared/core/dbData.js";
import {
  APP_CONFIG_TABLE,
  assertSafeTableName,
  MODULE_NAMESPACES,
  moduleTableName,
  type ModuleNamespace,
} from "../shared/core/moduleTable.js";
import {
  APP_CONFIG_DB_KEYS,
  buildMigratePlan,
  verifyModuleRowsMatchPlan,
  verifyPanelModuleRoundTrip,
  type MigratePlan,
} from "./lib/migrateJsonToDb.js";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const SLIM_CONFIG_KEYS = ["dbHost", "dbPort", "dbUser", "dbName"] as const;

interface CliOptions {
  dryRun: boolean;
  force: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { dryRun: false, force: false };
  for (const arg of argv) {
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--force") opts.force = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function readJsonFile(filePath: string): Record<string, unknown> {
  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("root must be a JSON object");
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    throw new Error(`Could not read "${filePath}": ${(err as Error).message}`);
  }
}

function readOptionalJson(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};
  return readJsonFile(filePath);
}

function deepEqualAppConfig(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const av = a[key];
    const bv = b[key];
    if (JSON.stringify(av) !== JSON.stringify(bv)) return false;
  }
  return true;
}

function collectUnknownDataDirs(): string[] {
  if (!existsSync(DATA_DIR)) return [];
  return readdirSync(DATA_DIR).filter((name) => {
    const full = path.join(DATA_DIR, name);
    if (!statSync(full).isDirectory()) return false;
    if (name.startsWith(".")) return false;
    return !(MODULE_NAMESPACES as readonly string[]).includes(name);
  });
}

function backupDataDir(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(DATA_DIR, `.migration-backup-${stamp}`);
  mkdirSync(dest, { recursive: true });

  for (const name of readdirSync(DATA_DIR)) {
    if (name.startsWith(".migration-backup-")) continue;
    cpSync(path.join(DATA_DIR, name), path.join(dest, name), { recursive: true });
  }

  console.log(`Backup created: ${dest}`);
  console.log(
    `Restore with: rm -rf data && cp -a ${path.relative(process.cwd(), dest)}/. data`,
  );
  return dest;
}

function loadLegacyModules(): Array<{
  namespace: ModuleNamespace;
  config: Record<string, unknown>;
  texts: Record<string, unknown>;
}> {
  const modules: Array<{
    namespace: ModuleNamespace;
    config: Record<string, unknown>;
    texts: Record<string, unknown>;
  }> = [];

  for (const namespace of MODULE_NAMESPACES) {
    const moduleDir = path.join(DATA_DIR, namespace);
    const configPath = path.join(moduleDir, "config.json");
    const textsPath = path.join(moduleDir, "texts.json");
    if (!existsSync(configPath) && !existsSync(textsPath)) continue;

    modules.push({
      namespace,
      config: readOptionalJson(configPath),
      texts: readOptionalJson(textsPath),
    });
  }

  return modules;
}

async function assertTablesEmptyOrForce(force: boolean): Promise<void> {
  const tables = [APP_CONFIG_TABLE, ...MODULE_NAMESPACES.map(moduleTableName)];
  const nonEmpty: string[] = [];
  for (const table of tables) {
    if (!(await tableIsEmpty(table))) nonEmpty.push(table);
  }
  if (nonEmpty.length > 0 && !force) {
    throw new Error(
      `Target tables already contain data: ${nonEmpty.join(", ")}. ` +
      "Use --force to overwrite.",
    );
  }
}

async function readTableRows(
  table: string,
  client?: pg.PoolClient,
): Promise<Record<string, unknown>> {
  assertSafeTableName(table);
  const runner = client ?? getDbPool();
  const result = await runner.query<{ key: string; value: unknown }>(
    `SELECT key, value FROM ${table}`,
  );
  const rows: Record<string, unknown> = {};
  for (const row of result.rows) {
    rows[row.key] = row.value;
  }
  return rows;
}

async function verifyMigration(input: {
  legacyConfig: Record<string, unknown>;
  modules: Array<{
    namespace: ModuleNamespace;
    config: Record<string, unknown>;
    texts: Record<string, unknown>;
  }>;
  modulePlans: MigratePlan["modules"];
  client?: pg.PoolClient;
}): Promise<string[]> {
  const errors: string[] = [];
  const expectedApp: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input.legacyConfig)) {
    if (APP_CONFIG_DB_KEYS.has(key)) continue;
    expectedApp[key] = value;
  }

  const actualApp = await readTableRows(APP_CONFIG_TABLE, input.client);
  if (!deepEqualAppConfig(actualApp, expectedApp)) {
    for (const key of Object.keys(expectedApp)) {
      if (JSON.stringify(actualApp[key]) !== JSON.stringify(expectedApp[key])) {
        errors.push(`app_config key "${key}" mismatch`);
      }
    }
    if (errors.length === 0) {
      errors.push("app_config mismatch");
    }
  }

  for (const moduleInput of input.modules) {
    const modulePlan = input.modulePlans.find(
      (p) => p.namespace === moduleInput.namespace,
    );
    if (!modulePlan) continue;

    const table = moduleTableName(moduleInput.namespace);
    const actualRows = await readTableRows(table, input.client);

    errors.push(
      ...verifyModuleRowsMatchPlan(
        moduleInput.namespace,
        actualRows,
        modulePlan.rows,
      ),
    );
    errors.push(
      ...verifyPanelModuleRoundTrip(
        moduleInput.namespace,
        actualRows,
        moduleInput.config,
        moduleInput.texts,
      ),
    );
  }

  return errors;
}

async function truncateMigrationTables(client: pg.PoolClient): Promise<void> {
  const tables = [APP_CONFIG_TABLE, ...MODULE_NAMESPACES.map(moduleTableName)];
  for (const table of tables) {
    assertSafeTableName(table);
    await client.query(`DELETE FROM ${table}`);
  }
}

function printPlanSummary(plan: MigratePlan): void {
  console.log(`app_config keys (${Object.keys(plan.appConfig).length}):`);
  for (const key of Object.keys(plan.appConfig).sort()) {
    console.log(`  - ${key}`);
  }
  for (const modulePlan of plan.modules) {
    console.log(
      `${moduleTableName(modulePlan.namespace)} keys (${Object.keys(modulePlan.rows).length}):`,
    );
    for (const key of Object.keys(modulePlan.rows).sort()) {
      console.log(`  - ${key}`);
    }
    for (const warning of modulePlan.warnings) {
      console.warn(`  warn: ${warning.message}`);
    }
  }
  for (const warning of plan.warnings) {
    console.warn(`warn: ${warning.message}`);
  }
}

function writeSlimConfig(existing: Record<string, unknown>): void {
  const slim: Record<string, unknown> = {};
  for (const key of SLIM_CONFIG_KEYS) {
    if (key in existing) slim[key] = existing[key];
  }
  if (!("dbHost" in slim)) slim.dbHost = "ttt-postgres";
  if (!("dbPort" in slim)) slim.dbPort = 5432;
  if (!("dbUser" in slim)) slim.dbUser = "ttt";
  if (!("dbName" in slim)) slim.dbName = "ttt";
  writeFileSync(CONFIG_FILE, `${JSON.stringify(slim, null, 2)}\n`, "utf8");
}

function finalizeFileCutover(modules: ModuleNamespace[]): void {
  if (existsSync(CONFIG_FILE)) {
    renameSync(CONFIG_FILE, `${CONFIG_FILE}.bak`);
  }
  writeSlimConfig(readJsonFile(`${CONFIG_FILE}.bak`));

  for (const namespace of modules) {
    const moduleDir = path.join(DATA_DIR, namespace);
    for (const name of ["config.json", "texts.json"] as const) {
      const filePath = path.join(moduleDir, name);
      if (existsSync(filePath)) {
        renameSync(filePath, `${filePath}.bak`);
      }
    }
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  if (!existsSync(CONFIG_FILE)) {
    throw new Error(`Missing ${CONFIG_FILE}`);
  }

  const legacyConfig = readJsonFile(CONFIG_FILE);
  const modules = loadLegacyModules();
  const unknownDirs = collectUnknownDataDirs();
  for (const dir of unknownDirs) {
    console.warn(`Unknown data directory (not migrated): data/${dir}/`);
  }

  const plan = buildMigratePlan({ legacyConfig, modules });
  printPlanSummary(plan);

  if (opts.dryRun) {
    console.log("Dry run complete — no database or file changes made.");
    return;
  }

  backupDataDir();
  initDbPool(loadDbBootstrapConfig());
  await assertTablesEmptyOrForce(opts.force);

  await withTransaction(async (client) => {
    if (opts.force) {
      await truncateMigrationTables(client);
    }

    for (const [key, value] of Object.entries(plan.appConfig)) {
      await client.query(
        `INSERT INTO ${APP_CONFIG_TABLE} (key, value, updated_at)
         VALUES ($1, $2::jsonb, now())
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = now()`,
        [key, JSON.stringify(value)],
      );
    }

    for (const modulePlan of plan.modules) {
      const table = moduleTableName(modulePlan.namespace);
      for (const [key, value] of Object.entries(modulePlan.rows)) {
        await client.query(
          `INSERT INTO ${table} (key, value, updated_at)
           VALUES ($1, $2::jsonb, now())
           ON CONFLICT (key) DO UPDATE
             SET value = EXCLUDED.value, updated_at = now()`,
          [key, JSON.stringify(value)],
        );
      }
    }

    const verifyErrors = await verifyMigration({
      legacyConfig,
      modules,
      modulePlans: plan.modules,
      client,
    });
    if (verifyErrors.length > 0) {
      console.error("Verification failed:");
      for (const err of verifyErrors) console.error(`  - ${err}`);
      throw new Error("Migration verify failed inside transaction.");
    }
  });

  finalizeFileCutover(modules.map((m) => m.namespace));
  console.log("Migration complete. JSON files renamed to *.json.bak.");
  await closeDbPool();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
