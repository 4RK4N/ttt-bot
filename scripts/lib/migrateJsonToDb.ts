import {
  MODULE_NAMESPACES,
  type ModuleNamespace,
} from "../../shared/core/moduleTable.js";

export const APP_CONFIG_DB_KEYS = new Set([
  "dbHost",
  "dbPort",
  "dbUser",
  "dbName",
  "databaseUrl",
  "_docker",
]);

export const PANEL_MODULE_META: Partial<
  Record<ModuleNamespace, { listKey: string; textsKey: string }>
> = {
  tickets: { listKey: "ticketTypes", textsKey: "types" },
  "reaction-roles": { listKey: "panels", textsKey: "panels" },
  "custom-embeds": { listKey: "panels", textsKey: "panels" },
};

export interface MigrateWarning {
  namespace?: string;
  message: string;
}

export interface MigrateModulePlan {
  namespace: ModuleNamespace;
  rows: Record<string, unknown>;
  warnings: MigrateWarning[];
}

export interface MigratePlan {
  appConfig: Record<string, unknown>;
  modules: MigrateModulePlan[];
  warnings: MigrateWarning[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAppConfigFromLegacy(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const rows: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (APP_CONFIG_DB_KEYS.has(key)) continue;
    rows[key] = value;
  }
  return rows;
}

export function mergePanelList(
  configData: Record<string, unknown>,
  textsData: Record<string, unknown>,
  listKey: string,
  textsKey: string,
  warnings: MigrateWarning[],
  namespace: string,
): unknown[] {
  const rawList = configData[listKey];
  const list = Array.isArray(rawList) ? rawList : [];
  const textsMap = isPlainObject(textsData[textsKey])
    ? (textsData[textsKey] as Record<string, Record<string, unknown>>)
    : {};

  const seen = new Set<string>();
  const merged: unknown[] = [];

  for (const raw of list) {
    if (!isPlainObject(raw)) {
      throw new Error(`[${namespace}] ${listKey} entries must be objects.`);
    }
    const id = raw.id;
    if (typeof id !== "string" || id.trim() === "") {
      throw new Error(`[${namespace}] ${listKey} entry missing id.`);
    }
    if (seen.has(id)) {
      throw new Error(`[${namespace}] duplicate ${listKey} id "${id}".`);
    }
    seen.add(id);

    const sidecar = textsMap[id];
    if (!sidecar) {
      warnings.push({
        namespace,
        message: `No ${textsKey} texts for ${listKey} id "${id}".`,
      });
      merged.push({ ...raw });
    } else {
      merged.push({ ...raw, ...sidecar });
    }
  }

  for (const id of Object.keys(textsMap)) {
    if (!seen.has(id)) {
      warnings.push({
        namespace,
        message: `Orphan ${textsKey} entry "${id}" (no ${listKey} row).`,
      });
    }
  }

  return merged;
}

export function planModuleMigration(
  namespace: ModuleNamespace,
  configData: Record<string, unknown>,
  textsData: Record<string, unknown>,
): MigrateModulePlan {
  const warnings: MigrateWarning[] = [];
  const rows: Record<string, unknown> = {};
  const panelMeta = PANEL_MODULE_META[namespace];

  if (panelMeta) {
    const { listKey, textsKey } = panelMeta;
    if (listKey in configData) {
      rows[listKey] = mergePanelList(
        configData,
        textsData,
        listKey,
        textsKey,
        warnings,
        namespace,
      );
    }
    for (const [key, value] of Object.entries(configData)) {
      if (key === listKey) continue;
      rows[key] = value;
    }
    for (const [key, value] of Object.entries(textsData)) {
      if (key === textsKey) continue;
      rows[key] = value;
    }
  } else {
    for (const [key, value] of Object.entries(configData)) {
      rows[key] = value;
    }
    for (const [key, value] of Object.entries(textsData)) {
      if (key in rows) {
        throw new Error(
          `[${namespace}] key "${key}" exists in both config and texts.`,
        );
      }
      rows[key] = value;
    }
  }

  return { namespace, rows, warnings };
}

export function splitPanelRowsForVerify(
  namespace: ModuleNamespace,
  rows: Record<string, unknown>,
): { config: Record<string, unknown>; texts: Record<string, unknown> } {
  const panelMeta = PANEL_MODULE_META[namespace];
  if (!panelMeta) {
    return { config: { ...rows }, texts: {} };
  }

  const { listKey, textsKey } = panelMeta;
  const config: Record<string, unknown> = {};
  const texts: Record<string, unknown> = {};
  const textsMap: Record<string, Record<string, unknown>> = {};

  for (const [key, value] of Object.entries(rows)) {
    if (key === listKey) {
      const merged = Array.isArray(value) ? value : [];
      const configRows: Record<string, unknown>[] = [];
      for (const raw of merged) {
        if (!isPlainObject(raw)) continue;
        const { id, ...rest } = raw;
        if (typeof id !== "string") continue;
        const configRow: Record<string, unknown> = { id };
        const textRow: Record<string, unknown> = {};
        for (const [fieldKey, fieldValue] of Object.entries(rest)) {
          if (
            [
              "published",
              "panelMessageId",
              "channelId",
              "emoji",
              "staffRoleId",
              "deniedRoleIds",
              "roleActionRoleId",
              "reactionType",
              "toggleable",
              "roleOptions",
              "showTimestamp",
            ].includes(fieldKey)
          ) {
            configRow[fieldKey] = fieldValue;
          } else {
            textRow[fieldKey] = fieldValue;
          }
        }
        configRows.push(configRow);
        if (Object.keys(textRow).length > 0) {
          textsMap[id] = textRow;
        }
      }
      config[listKey] = configRows;
      if (Object.keys(textsMap).length > 0) {
        texts[textsKey] = textsMap;
      }
      continue;
    }

    if (
      [
        "enabled",
        "channelId",
        "rulesChannelId",
        "channelIds",
        "deleteEmoji",
        "deleteAuthorLastMention",
        "emojiRoleId",
        "logJoins",
        "logLeaves",
        "logMessageDeleted",
        "logMemberBanned",
        "logMemberUnbanned",
        "deleteNonQualifyingMessages",
      ].includes(key)
    ) {
      config[key] = value;
    } else {
      texts[key] = value;
    }
  }

  return { config, texts };
}

export function buildMigratePlan(input: {
  legacyConfig: Record<string, unknown>;
  modules: Array<{
    namespace: ModuleNamespace;
    config: Record<string, unknown>;
    texts: Record<string, unknown>;
  }>;
}): MigratePlan {
  const warnings: MigrateWarning[] = [];
  const appConfig = parseAppConfigFromLegacy(input.legacyConfig);
  const modules = input.modules.map(({ namespace, config, texts }) => {
    const plan = planModuleMigration(namespace, config, texts);
    warnings.push(...plan.warnings);
    return plan;
  });
  return { appConfig, modules, warnings };
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
    for (const key of keys) {
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }
    return true;
  }
  return false;
}

/** Compare DB rows to the migration plan (works for flat and panel modules). */
export function verifyModuleRowsMatchPlan(
  namespace: ModuleNamespace,
  actualRows: Record<string, unknown>,
  expectedRows: Record<string, unknown>,
): string[] {
  if (deepEqual(actualRows, expectedRows)) return [];
  return [`[${namespace}] module rows mismatch`];
}

/** Panel-only round-trip check against original config/texts files. */
export function verifyPanelModuleRoundTrip(
  namespace: ModuleNamespace,
  actualRows: Record<string, unknown>,
  originalConfig: Record<string, unknown>,
  originalTexts: Record<string, unknown>,
): string[] {
  if (!PANEL_MODULE_META[namespace]) return [];
  const split = splitPanelRowsForVerify(namespace, actualRows);
  const errors: string[] = [];
  if (!deepEqual(split.config, originalConfig)) {
    errors.push(`[${namespace}] config.json round-trip mismatch`);
  }
  if (!deepEqual(split.texts, originalTexts)) {
    errors.push(`[${namespace}] texts.json round-trip mismatch`);
  }
  return errors;
}

export function assertKnownNamespaces(namespaces: string[]): ModuleNamespace[] {
  const out: ModuleNamespace[] = [];
  for (const ns of namespaces) {
    if (!(MODULE_NAMESPACES as readonly string[]).includes(ns)) {
      throw new Error(`Unknown module namespace "${ns}".`);
    }
    out.push(ns as ModuleNamespace);
  }
  return out;
}
