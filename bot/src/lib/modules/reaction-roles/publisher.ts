import { createPanelPublisher } from "../../core/panelPublisher.js";
import {
  getRolePanelConfig,
  resolvePanel,
  updateRolePanel,
} from "./config-io.js";
import { publishPanel, type DiscordApiContext } from "./panel.js";

export const { publish: publishRolePanel, unpublish: unpublishRolePanel } =
  createPanelPublisher({
    resolve: resolvePanel,
    getConfig: getRolePanelConfig,
    update: updateRolePanel,
    publishPanel,
    entityLabel: "role panel",
  });

export type { DiscordApiContext };
