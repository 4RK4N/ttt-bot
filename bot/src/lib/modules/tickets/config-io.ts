import { createConfigIo } from "../../core/configIo.js";
import type { TicketTypeConfig } from "../../../../../shared/modules/tickets/types.js";
import {
  CONFIG_DEFAULTS,
  MODULE_DEFAULTS,
  NAMESPACE,
  get,
  data,
  resolveTicketType,
} from "../../../../../shared/modules/tickets/types.js";

const io = createConfigIo<TicketTypeConfig>(NAMESPACE, "ticketTypes");

export const updateTicketType = io.updateItem;
export const getTicketTypeConfig = io.getItemConfig;

export {
  NAMESPACE,
  CONFIG_DEFAULTS,
  MODULE_DEFAULTS,
  get,
  data,
  resolveTicketType,
};
