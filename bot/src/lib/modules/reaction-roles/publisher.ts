import { createPanelPublisher } from "../../core/panelPublisher.js";
import {
  getRolePanelConfig,
  resolvePanel,
  updateRolePanel,
} from "./config-io.js";
import { publishPanel, type DiscordApiContext } from "./panel.js";

const panelPublisher = createPanelPublisher({
  resolve: resolvePanel,
  getConfig: getRolePanelConfig,
  update: updateRolePanel,
  publishPanel,
  entityLabel: "panel",
});

export async function publishRolePanel(
  ctx: DiscordApiContext,
  panelId: string,
): Promise<void> {
  return panelPublisher.publish(ctx, panelId);
}

export async function unpublishRolePanel(panelId: string): Promise<void> {
  return panelPublisher.unpublish(panelId);
}
