import { createConfigIo } from '../../core/configIo.js';
import type { RolePanelConfig } from './types.js';
import { CONFIG_DEFAULTS, NAMESPACE } from './types.js';

const io = createConfigIo<RolePanelConfig>(NAMESPACE, 'panels', CONFIG_DEFAULTS);

export const updatePanel = io.updateItem;
export const getPanelConfig = io.getItemConfig;
