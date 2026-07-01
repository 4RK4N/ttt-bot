import {
  Events,
  type Client,
  type EmbedBuilder,
  type GuildBan,
  type GuildMember,
  type Message,
  type PartialGuildMember,
  type PartialMessage,
  type TextChannel,
} from 'discord.js';
import type { CommandModule } from '../../core/moduleLoader.js';
import { getConfig, getTexts, isModuleEnabled } from '../../core/texts.js';
import { findRecentBan, findRecentKick } from './audit.js';
import {
  TEXT_DEFAULTS,
  buildMemberBannedEmbed,
  buildMemberKickedEmbed,
  buildMemberLeftEmbed,
  buildMessageDeletedEmbed,
  type ModLogTexts,
} from './embeds.js';

const NAMESPACE = 'moderation-log';

interface ModLogConfig {
  channelId: string;
  logMessageDeleted: boolean;
  logMemberLeft: boolean;
  logMemberKicked: boolean;
  logMemberBanned: boolean;
}

const CONFIG_DEFAULTS: ModLogConfig = {
  channelId: '',
  logMessageDeleted: true,
  logMemberLeft: true,
  logMemberKicked: true,
  logMemberBanned: true,
};

/** User IDs recently banned — suppresses duplicate leave/kick logs. */
const recentBans = new Set<string>();
const BAN_DEDUPE_MS = 10_000;

function config(): ModLogConfig {
  return getConfig(NAMESPACE, CONFIG_DEFAULTS);
}

function texts(): ModLogTexts {
  return getTexts(NAMESPACE, TEXT_DEFAULTS);
}

function logChannelId(): string | undefined {
  const id = config().channelId.trim();
  return id === '' ? undefined : id;
}

function markRecentBan(userId: string): void {
  recentBans.add(userId);
  setTimeout(() => recentBans.delete(userId), BAN_DEDUPE_MS).unref();
}

function wasRecentBan(userId: string): boolean {
  return recentBans.has(userId);
}

async function postLog(client: Client, embed: EmbedBuilder): Promise<void> {
  const channelId = logChannelId();
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased() || channel.isDMBased()) {
    console.warn(`[moderation-log] Log channel "${channelId}" is not a guild text channel.`);
    return;
  }

  await (channel as TextChannel).send({ embeds: [embed] });
}

async function handleMessageDelete(message: Message | PartialMessage): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!config().logMessageDeleted) return;

  const channelId = logChannelId();
  if (!channelId) return;

  const guild = message.guild;
  if (!guild) return;
  if (message.channelId === channelId) return;

  const author = message.author;
  if (!author) return;

  const content = message.content ?? null;

  const embed = buildMessageDeletedEmbed(
    texts(),
    author,
    message.channelId,
    message.id,
    content,
    message.createdAt
  );

  await postLog(message.client, embed);
}

async function handleGuildBanAdd(ban: GuildBan): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!config().logMemberBanned) return;
  if (!logChannelId()) return;

  markRecentBan(ban.user.id);

  const audit = await findRecentBan(ban.guild, ban.user.id);
  const embed = buildMemberBannedEmbed(texts(), ban.user, new Date(), audit?.executorId ?? null);
  await postLog(ban.client, embed);
}

async function handleGuildMemberRemove(member: GuildMember | PartialGuildMember): Promise<void> {
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!logChannelId()) return;
  if (wasRecentBan(member.id)) return;

  const cfg = config();
  const t = texts();
  const timestamp = new Date();

  const kickEntry =
    cfg.logMemberKicked || cfg.logMemberLeft
      ? await findRecentKick(member.guild, member.id)
      : null;

  if (kickEntry) {
    if (cfg.logMemberKicked) {
      await postLog(
        member.client,
        buildMemberKickedEmbed(t, member.user, timestamp, kickEntry.executorId)
      );
    }
    return;
  }

  if (!cfg.logMemberLeft) return;

  await postLog(member.client, buildMemberLeftEmbed(t, member.user, timestamp));
}

const moderationLogModule: CommandModule = {
  name: NAMESPACE,
  init(client: Client): void {
    if (!logChannelId()) {
      console.warn(
        '[moderation-log] No channelId configured in ' +
        'data/moderation-log/config.json; moderation logging is disabled.'
      );
    }

    client.on(Events.MessageDelete, (message) => {
      void handleMessageDelete(message).catch((err) => {
        console.error('[moderation-log] MessageDelete handler error:', err);
      });
    });

    client.on(Events.GuildBanAdd, (ban) => {
      void handleGuildBanAdd(ban).catch((err) => {
        console.error('[moderation-log] GuildBanAdd handler error:', err);
      });
    });

    client.on(Events.GuildMemberRemove, (member) => {
      void handleGuildMemberRemove(member).catch((err) => {
        console.error('[moderation-log] GuildMemberRemove handler error:', err);
      });
    });
  },
};

export default moderationLogModule;
