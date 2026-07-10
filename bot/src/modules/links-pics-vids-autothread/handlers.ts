import { GuildMember, type Message } from "discord.js";
import { isModuleEnabled } from "../../../../shared/core/texts.js";
import {
  buildThreadName,
  startAndPopulateCommentsThread,
} from "../../lib/core/threads.js";
import { resolveDisplayName } from "../../lib/core/memberDisplayNames.js";
import {
  NAMESPACE,
  channelIds,
  texts,
} from "../../lib/modules/links-pics-vids-autothread/config-io.js";
import { extractSupportedAutoThreadUrls, stripUrls } from "./urls.js";

function hasImageOrVideoAttachment(message: Message): boolean {
  return message.attachments.some((attachment) => {
    const type = attachment.contentType ?? "";
    return type.startsWith("image/") || type.startsWith("video/");
  });
}

export async function handleMessage(message: Message): Promise<void> {
  if (message.author.bot || message.system) return;
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!channelIds().includes(message.channelId)) return;
  if (message.channel.isThread() || message.hasThread) return;

  const content = message.content ?? "";
  const hasSupportedLink = extractSupportedAutoThreadUrls(content).length > 0;
  const hasMedia = hasImageOrVideoAttachment(message);

  if (!hasSupportedLink && !hasMedia) return;

  const name = buildThreadName(
    resolveDisplayName(
      message.member instanceof GuildMember ? message.member : null,
      message.author,
    ),
    stripUrls(content),
    {
      guild: message.guild,
      client: message.client,
      message,
    },
  );

  await startAndPopulateCommentsThread(message, {
    name,
    logPrefix: `[${NAMESPACE}]`,
    authorUserId: message.author.id,
    firstMessage: texts().threadFirstMessage,
  });
}
