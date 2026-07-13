/**
 * Module types, defaults, and DB-backed accessors.
 *
 * Handlers should import via config-io.ts, not directly from here.
 */
import {
  createModuleData,
  moduleDefaultsFromParts,
} from "../../../../../shared/core/moduleConfig.js";

export interface ExampleConfig {
  enabled?: boolean;
  channelId: string;
}

export interface ExampleTexts {
  disabled: string;
  greeting: string;
}

export const CONFIG_DEFAULTS: ExampleConfig = {
  enabled: true,
  channelId: "",
};

export const TEXT_DEFAULTS: ExampleTexts = {
  disabled: "This feature is currently disabled.",
  greeting: "Hello {mention}!",
};

export type ExampleModuleData = ExampleConfig & ExampleTexts;

export const MODULE_DEFAULTS: ExampleModuleData = moduleDefaultsFromParts(
  CONFIG_DEFAULTS,
  TEXT_DEFAULTS,
);

const mod = createModuleData("example-module", MODULE_DEFAULTS);

export const NAMESPACE = mod.NAMESPACE;
export const get = mod.get;
export const data = mod.data;

export function targetChannelId(): string | undefined {
  const id = get("channelId").trim();
  return id === "" ? undefined : id;
}
