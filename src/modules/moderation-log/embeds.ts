import type { EmbedBuilder } from 'discord.js';
import { buildEmbed } from '../../core/embedBuilder.js';
import { format } from '../../core/texts.js';

const MAX_CONTENT_LENGTH = 1_000;

export interface ModLogTexts {
  messageDeleted: string;
  messageDeletedEmpty: string;
  memberLeft: string;
  memberKicked: string;
  memberBanned: string;
  executorUnknown: string;
  footerMessageId: string;
  footerUserId: string;
}

export const TEXT_DEFAULTS: ModLogTexts = {
  messageDeleted: '🗑️ Message sent by {author} deleted in {channel}',
  messageDeletedEmpty: '[no text content]',
  memberLeft: '📤 {mention} has left the server',
  memberKicked: '👮 {mention} has been kicked by {executorId}',
  memberBanned: '👮 🔒 {mention} has been banned by {executorId}',
  executorUnknown: 'Unknown',
  footerMessageId: 'Message ID: {messageId}',
  footerUserId: 'ID: {userId}',
};

interface UserLike {
  id: string;
  username: string;
  displayAvatarURL: () => string;
}

export function buildMessageDeletedEmbed(
  texts: ModLogTexts,
  author: UserLike,
  channelId: string,
  messageId: string,
  content: string | null,
  timestamp: Date
): EmbedBuilder {
  const header = format(texts.messageDeleted, {
    author: `<@${author.id}>`,
    channel: `<#${channelId}>`,
  });

  const body = content?.trim()
    ? `${header}\n${truncateContent(content)}`
    : `${header}\n${texts.messageDeletedEmpty}`;

  return buildEmbed({
    description: body,
    author: { name: author.username, iconURL: author.displayAvatarURL() },
    footer: format(texts.footerMessageId, { messageId }),
    timestamp,
  });
}

export function buildMemberLeftEmbed(
  texts: ModLogTexts,
  user: UserLike,
  timestamp: Date
): EmbedBuilder {
  return buildMemberEmbed(texts.memberLeft, texts.footerUserId, texts, user, timestamp);
}

export function buildMemberKickedEmbed(
  texts: ModLogTexts,
  user: UserLike,
  timestamp: Date,
  executorId: string | null
): EmbedBuilder {
  return buildMemberEmbed(texts.memberKicked, texts.footerUserId, texts, user, timestamp, executorId);
}

export function buildMemberBannedEmbed(
  texts: ModLogTexts,
  user: UserLike,
  timestamp: Date,
  executorId: string | null
): EmbedBuilder {
  return buildMemberEmbed(texts.memberBanned, texts.footerUserId, texts, user, timestamp, executorId);
}

function buildMemberEmbed(
  descriptionTemplate: string,
  footerTemplate: string,
  texts: ModLogTexts,
  user: UserLike,
  timestamp: Date,
  executorId: string | null = null
): EmbedBuilder {
  const vars: Record<string, string> = {
    mention: `<@${user.id}>`,
    executorId: executorId ? `<@${executorId}>` : texts.executorUnknown,
  };

  return buildEmbed({
    description: format(descriptionTemplate, vars),
    author: { name: user.username, iconURL: user.displayAvatarURL() },
    footer: format(footerTemplate, { userId: user.id }),
    timestamp,
  });
}

function truncateContent(content: string): string {
  if (content.length <= MAX_CONTENT_LENGTH) return content;
  return `${content.slice(0, MAX_CONTENT_LENGTH - 1)}…`;
}
