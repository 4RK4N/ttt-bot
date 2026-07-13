/**
 * Config IO boundary — the import surface for handlers, panels, and publish code.
 */
export {
  NAMESPACE,
  CONFIG_DEFAULTS,
  TEXT_DEFAULTS,
  MODULE_DEFAULTS,
  get,
  data,
  targetChannelId,
} from "./types.js";

// --- Panel module (uncomment; remove simple barrel above) ---------------------
/*
import { createConfigIo } from '../../core/configIo.js';
import type { ExamplePanelConfig } from '../../../../../shared/modules/<name>/types.js';
import {
  CONFIG_DEFAULTS,
  MODULE_DEFAULTS,
  NAMESPACE,
  get,
  data,
  resolveExamplePanel,
} from '../../../../../shared/modules/<name>/types.js';

const io = createConfigIo<ExamplePanelConfig>(NAMESPACE, 'panels');

export const updateExamplePanel = io.updateItem;
export const getExamplePanelConfig = io.getItemConfig;

export {
  NAMESPACE,
  CONFIG_DEFAULTS,
  MODULE_DEFAULTS,
  get,
  data,
  resolveExamplePanel,
};
*/
