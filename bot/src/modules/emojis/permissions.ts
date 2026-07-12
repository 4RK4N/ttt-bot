import { PermissionFlagsBits, type GuildMember } from "discord.js";
import { memberHasAnyRole } from "../../lib/core/discordInteractions.js";

/** Configured emoji manager role or guild Administrator. */
export function canEmojiOrAdmin(
  member: GuildMember,
  emojiRoleId: string | undefined,
): boolean {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const roleId = emojiRoleId?.trim();
  if (!roleId) return false;
  return memberHasAnyRole(member, [roleId]);
}
