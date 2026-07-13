import { createConfigIo } from "../../core/configIo.js";
import type { RolePanelConfig } from "../../../../../shared/modules/reaction-roles/types.js";
import {
  CONFIG_DEFAULTS,
  MODULE_DEFAULTS,
  NAMESPACE,
  findPanelByMessageId,
  get,
  data,
  resolveOption,
  resolvePanel,
} from "../../../../../shared/modules/reaction-roles/types.js";

const io = createConfigIo<RolePanelConfig>(NAMESPACE, "panels");

export const updateRolePanel = io.updateItem;
export const getRolePanelConfig = io.getItemConfig;

export {
  NAMESPACE,
  CONFIG_DEFAULTS,
  MODULE_DEFAULTS,
  findPanelByMessageId,
  get,
  data,
  resolveOption,
  resolvePanel,
};
