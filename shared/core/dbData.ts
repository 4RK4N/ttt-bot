import type pg from "pg";
import { assertSafeTableName } from "./moduleTable.js";
import { getDbPool, withTransaction } from "./db.js";

interface TableCacheEntry {
  stampMs: number;
  rows: Map<string, unknown>;
}

const tableCache = new Map<string, TableCacheEntry>();

function mergeDefaults<T extends object>(
  defaults: T,
  rows: Map<string, unknown>,
): T {
  const out = { ...defaults } as Record<string, unknown>;
  for (const [key, value] of rows) {
    out[key] = value;
  }
  return out as T;
}

async function loadTableStamp(
  client: pg.Pool | pg.PoolClient,
  table: string,
): Promise<number> {
  const result = await client.query<{ max: Date | null }>(
    `SELECT MAX(updated_at) AS max FROM ${table}`,
  );
  const max = result.rows[0]?.max;
  return max ? max.getTime() : 0;
}

async function loadTableRows(
  client: pg.Pool | pg.PoolClient,
  table: string,
): Promise<Map<string, unknown>> {
  const result = await client.query<{ key: string; value: unknown }>(
    `SELECT key, value FROM ${table}`,
  );
  const rows = new Map<string, unknown>();
  for (const row of result.rows) {
    rows.set(row.key, row.value);
  }
  return rows;
}

async function refreshCacheIfNeeded(table: string): Promise<TableCacheEntry> {
  assertSafeTableName(table);
  const pool = getDbPool();
  const stampMs = await loadTableStamp(pool, table);
  const cached = tableCache.get(table);
  if (cached && cached.stampMs === stampMs) {
    return cached;
  }
  const rows = await loadTableRows(pool, table);
  const entry = { stampMs, rows };
  tableCache.set(table, entry);
  return entry;
}

export function invalidateTableCache(table: string): void {
  tableCache.delete(table);
}

export async function getDbData(table: string, key: string): Promise<unknown> {
  const entry = await refreshCacheIfNeeded(table);
  return entry.rows.get(key);
}

/** Reads a single key on an open transaction connection (no cache). */
export async function getDbDataFromClient(
  client: pg.PoolClient,
  table: string,
  key: string,
): Promise<unknown> {
  assertSafeTableName(table);
  const result = await client.query<{ value: unknown }>(
    `SELECT value FROM ${table} WHERE key = $1`,
    [key],
  );
  return result.rows[0]?.value;
}

export async function getDbDataAll(
  table: string,
  defaults?: object,
): Promise<Record<string, unknown>> {
  const entry = await refreshCacheIfNeeded(table);
  if (!defaults) {
    return Object.fromEntries(entry.rows);
  }
  return mergeDefaults(defaults, entry.rows) as Record<string, unknown>;
}

export async function setDbData(
  table: string,
  key: string,
  value: unknown,
  client?: pg.PoolClient,
): Promise<void> {
  assertSafeTableName(table);
  const run = async (c: pg.PoolClient) => {
    await c.query(
      `INSERT INTO ${table} (key, value, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = now()`,
      [key, JSON.stringify(value)],
    );
  };

  if (client) {
    await run(client);
  } else {
    await withTransaction(async (c) => run(c));
  }
  invalidateTableCache(table);
}

export async function setDbDataMany(
  table: string,
  rows: Record<string, unknown>,
  client?: pg.PoolClient,
): Promise<void> {
  assertSafeTableName(table);
  const run = async (c: pg.PoolClient) => {
    for (const [key, value] of Object.entries(rows)) {
      await c.query(
        `INSERT INTO ${table} (key, value, updated_at)
         VALUES ($1, $2::jsonb, now())
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = now()`,
        [key, JSON.stringify(value)],
      );
    }
  };

  if (client) {
    await run(client);
  } else {
    await withTransaction(async (c) => run(c));
  }
  invalidateTableCache(table);
}

export async function tableIsEmpty(table: string): Promise<boolean> {
  assertSafeTableName(table);
  const result = await getDbPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${table}`,
  );
  return result.rows[0]?.count === "0";
}
