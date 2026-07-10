import { Events, type Client } from "discord.js";
import type { CommandModule } from "../../moduleLoader.js";
import {
  NAMESPACE,
  channelIds,
} from "../../lib/modules/links-pics-vids-autothread/config-io.js";
import { handleMessage } from "./handlers.js";

const linksPicsVidsAutoThreadModule: CommandModule = {
  name: NAMESPACE,
  init(client: Client): void {
    if (channelIds().length === 0) {
      console.warn(
        "[links-pics-vids-autothread] No channelIds configured in " +
          "data/links-pics-vids-autothread/config.json; auto-threading is disabled.",
      );
      return;
    }

    client.on(Events.MessageCreate, (message) => {
      void handleMessage(message).catch((err) => {
        console.error("[links-pics-vids-autothread] Unhandled error:", err);
      });
    });
  },
};

export default linksPicsVidsAutoThreadModule;
