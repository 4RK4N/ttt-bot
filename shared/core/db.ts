import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

export interface DbBootstrapConfig {
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbName: string;
}

let pool: pg.Pool | null = null;

function optionalPort(value: unknown, fallback: number): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536
    ? parsed
    : fallback;
}

export function loadDbBootstrapConfig(): DbBootstrapConfig {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as Record<
      string,
      unknown
    >;
  } catch (err) {
    throw new Error(
      `Could not read DB bootstrap config from "${CONFIG_FILE}". ` +
      'Copy "data/config.example.json" to "data/config.json". ' +
      `(${(err as Error).message})`,
    );
  }

  function requiredString(key: string): string {
    const value = raw[key];
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(
        `Missing required DB config "${key}" in "${CONFIG_FILE}".`,
      );
    }
    return value.trim();
  }

  return {
    dbHost: requiredString("dbHost"),
    dbPort: optionalPort(raw.dbPort, 5432),
    dbUser: requiredString("dbUser"),
    dbName: requiredString("dbName"),
  };
}

export function initDbPool(
  bootstrap: DbBootstrapConfig = loadDbBootstrapConfig(),
): pg.Pool {
  if (pool) return pool;
  pool = new pg.Pool({
    host: bootstrap.dbHost,
    port: bootstrap.dbPort,
    user: bootstrap.dbUser,
    database: bootstrap.dbName,
  });
  return pool;
}

export function getDbPool(): pg.Pool {
  if (!pool) {
    throw new Error("Database pool not initialized. Call initDbPool() first.");
  }
  return pool;
}

export async function closeDbPool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getDbPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
