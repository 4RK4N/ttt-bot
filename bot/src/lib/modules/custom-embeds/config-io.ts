import { createConfigIo } from "../../core/configIo.js";
import type { EmbedPanelConfig } from "../../../../../shared/modules/custom-embeds/types.js";
import {
  CONFIG_DEFAULTS,
  MODULE_DEFAULTS,
  NAMESPACE,
  get,
  data,
  resolveEmbedPanel,
} from "../../../../../shared/modules/custom-embeds/types.js";

const io = createConfigIo<EmbedPanelConfig>(NAMESPACE, "panels");

export const updateEmbedPanel = io.updateItem;
export const getEmbedPanelConfig = io.getItemConfig;

export {
  NAMESPACE,
  CONFIG_DEFAULTS,
  MODULE_DEFAULTS,
  get,
  data,
  resolveEmbedPanel,
};
