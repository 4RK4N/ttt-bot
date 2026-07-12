import {
  DiscordAPIError,
  GuildMember,
  type Message,
  type User,
} from "discord.js";
import {
  channelUrl,
  DISCORD_CANNOT_SEND_DM,
  DISCORD_MESSAGE_CONTENT_MAX,
} from "../../../../shared/core/limits.js";
import { format, isModuleEnabled } from "../../../../shared/core/texts.js";
import { buildEmbed } from "../../lib/core/embedBuilder.js";
import {
  buildThreadName,
  startAndPopulateCommentsThread,
} from "../../lib/core/threads.js";
import { resolveDisplayName } from "../../lib/core/memberDisplayNames.js";
import {
  NAMESPACE,
  channelIds,
  deleteNonQualifyingMessagesEnabled,
  texts,
} from "../../lib/modules/links-pics-vids-autothread/config-io.js";
import { extractSupportedAutoThreadUrls, stripUrls } from "./urls.js";

function hasImageOrVideoAttachment(message: Message): boolean {
  return message.attachments.some((attachment) => {
    const type = attachment.contentType ?? "";
    return type.startsWith("image/") || type.startsWith("video/");
  });
}

export function messageQualifiesForAutoThread(message: Message): boolean {
  const content = message.content ?? "";
  const hasSupportedLink = extractSupportedAutoThreadUrls(content).length > 0;
  const hasMedia = hasImageOrVideoAttachment(message);
  return hasSupportedLink || hasMedia;
}

function resolveChannelLink(message: Message): string {
  const guildId = message.guild?.id;
  if (guildId) {
    return channelUrl(guildId, message.channelId);
  }
  return "";
}

function formatNonQualifyingDm(
  channelLink: string,
  messageContent: string,
): string {
  return format(texts().nonQualifyingDm, {
    channel: channelLink,
    message: messageContent,
  });
}

function buildNonQualifyingDmPayload(
  channelLink: string,
  messageContent: string,
): { content: string } | { embeds: ReturnType<typeof buildEmbed>[] } {
  const dmText = formatNonQualifyingDm(channelLink, messageContent);
  if (dmText.length <= DISCORD_MESSAGE_CONTENT_MAX) {
    return { content: dmText };
  }
  return { embeds: [buildEmbed({ description: dmText })] };
}

async function sendNonQualifyingDm(
  author: User,
  channelLink: string,
  messageContent: string,
): Promise<void> {
  const payload = buildNonQualifyingDmPayload(channelLink, messageContent);
  try {
    await author.send(payload);
  } catch (err) {
    if (err instanceof DiscordAPIError && err.code === DISCORD_CANNOT_SEND_DM) {
      console.warn(
        `[${NAMESPACE}] Could not DM ${author.tag} (DMs closed) after deleting non-qualifying post.`,
      );
      return;
    }
    console.error(
      `[${NAMESPACE}] Failed to send non-qualifying DM to ${author.tag}:`,
      err,
    );
  }
}

async function deleteNonQualifyingMessage(message: Message): Promise<void> {
  const messageContent = message.content ?? "";
  const channelLink = resolveChannelLink(message);

  try {
    await message.delete();
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 10008) return;
    console.error(
      `[${NAMESPACE}] Failed to delete non-qualifying message=${message.id}:`,
      err,
    );
    return;
  }

  await sendNonQualifyingDm(message.author, channelLink, messageContent);
}

export async function handleMessage(message: Message): Promise<void> {
  if (message.author.bot || message.system) return;
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!channelIds().includes(message.channelId)) return;
  if (message.channel.isThread() || message.hasThread) return;

  if (!messageQualifiesForAutoThread(message)) {
    if (deleteNonQualifyingMessagesEnabled()) {
      await deleteNonQualifyingMessage(message);
    }
    return;
  }

  const content = message.content ?? "";
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
