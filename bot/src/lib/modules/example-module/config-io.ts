/**
 * Config IO boundary — the import surface for handlers, panels, and publish code.
 */
export * from "./types.js";

// --- Panel module (uncomment; remove simple barrel above) ---------------------
/*
import { createConfigIo } from '../../core/configIo.js';
import { NAMESPACE, type ExamplePanelConfig } from '../../../../../shared/modules/<name>/types.js';
export * from '../../../../../shared/modules/<name>/types.js';

const io = createConfigIo<ExamplePanelConfig>(NAMESPACE, 'panels');
export const updateExamplePanel = io.updateItem;
export const getExamplePanelConfig = io.getItemConfig;
*/
