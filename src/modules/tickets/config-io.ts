import { createConfigIo } from '../../core/configIo.js';
import type { TicketTypeConfig } from './types.js';
import { CONFIG_DEFAULTS, NAMESPACE } from './types.js';

const io = createConfigIo<TicketTypeConfig>(NAMESPACE, 'ticketTypes', CONFIG_DEFAULTS);

export const updateTicketType = io.updateItem;
export const getTicketTypeConfig = io.getItemConfig;
