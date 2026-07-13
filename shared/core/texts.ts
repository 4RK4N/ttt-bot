import path from "node:path";
import { getDbDataAll, invalidateTableCache } from "./dbData.js";
import { getDbPool } from "./db.js";
import { moduleTableName } from "./moduleTable.js";

export const DATA_DIR = path.resolve(process.cwd(), "data");

/** Resolves a path inside a module's data folder: data/<namespace>/<segments>. */
export function moduleDataPath(
  namespace: string,
  ...segments: string[]
): string {
  assertSafePathSegment(namespace, "namespace");
  for (const segment of segments) {
    assertSafePathSegment(segment, "path segment");
  }
  const dataRoot = path.resolve(DATA_DIR);
  const resolved = path.resolve(dataRoot, namespace, ...segments);
  if (resolved !== dataRoot && !resolved.startsWith(`${dataRoot}${path.sep}`)) {
    throw new Error("Path escapes data directory.");
  }
  return resolved;
}

function assertSafePathSegment(segment: string, label: string): void {
  if (
    !segment ||
    segment === "." ||
    segment === ".." ||
    segment.includes("\0") ||
    segment.includes("/") ||
    segment.includes("\\")
  ) {
    throw new Error(`Invalid ${label}.`);
  }
}

/**
 * Replaces `{token}` placeholders in a template with the provided values.
 * Unknown tokens are left untouched.
 */
export function format(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

const syncCache = new Map<string, Record<string, unknown>>();
const syncCacheStamps = new Map<string, number>();

async function loadTableStampMs(table: string): Promise<number> {
  const result = await getDbPool().query<{ max: Date | null }>(
    `SELECT MAX(updated_at) AS max FROM ${table}`,
  );
  const max = result.rows[0]?.max;
  return max ? max.getTime() : 0;
}

function merge<T extends object>(defaults: T, overrides: Partial<T>): T {
  return { ...defaults, ...overrides };
}

function cachedData<T extends object>(
  defaults: T,
  rows: Record<string, unknown>,
): T {
  return merge(defaults, rows as Partial<T>);
}

/** Clears cached reads for a module after a write. */
export function invalidateModuleCache(namespace: string): void {
  syncCache.delete(namespace);
  syncCacheStamps.delete(namespace);
  invalidateTableCache(moduleTableName(namespace));
}

export function getModuleRowsSync(namespace: string): Record<string, unknown> {
  const cached = syncCache.get(namespace);
  if (!cached) {
    throw new Error(
      `Module "${namespace}" cache is cold. Call warmModuleCache() during startup.`,
    );
  }
  return { ...cached };
}

export function getModuleDataSync<T extends object>(
  namespace: string,
  defaults: T,
): T {
  const cached = syncCache.get(namespace);
  if (cached) {
    return cachedData(defaults, cached);
  }
  throw new Error(
    `Module "${namespace}" cache is cold. Call warmModuleCache() during startup.`,
  );
}

export async function warmModuleCache(namespace: string): Promise<void> {
  const table = moduleTableName(namespace);
  syncCache.set(namespace, await getDbDataAll(table));
  syncCacheStamps.set(namespace, await loadTableStampMs(table));
}

export async function warmAllModuleCaches(namespaces: string[]): Promise<void> {
  await Promise.all(namespaces.map((ns) => warmModuleCache(ns)));
}

/** Reloads module sync caches when another process updates the DB. */
export async function refreshStaleModuleCaches(
  namespaces: string[],
): Promise<void> {
  await Promise.all(
    namespaces.map(async (namespace) => {
      const table = moduleTableName(namespace);
      const stampMs = await loadTableStampMs(table);
      if (syncCacheStamps.get(namespace) === stampMs) return;
      await warmModuleCache(namespace);
    }),
  );
}

export function isModuleEnabled(namespace: string): boolean {
  const cached = syncCache.get(namespace);
  if (!cached) return true;
  return cached.enabled !== false;
}
