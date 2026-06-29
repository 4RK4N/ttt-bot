import { PermissionFlagsBits, type Guild, type ThreadChannel } from 'discord.js';

/** Non-bot guild admins plus all members of the configured staff roles (deduped). */
export function collectStaffUserIds(guild: Guild, staffRoleIds: string[]): string[] {
  const ids = new Set<string>();

  for (const role of guild.roles.cache.values()) {
    if (!role.permissions.has(PermissionFlagsBits.Administrator)) continue;
    for (const member of role.members.values()) {
      if (!member.user.bot) ids.add(member.id);
    }
  }

  for (const roleId of staffRoleIds) {
    const role = guild.roles.cache.get(roleId);
    if (!role) continue;
    for (const member of role.members.values()) {
      if (!member.user.bot) ids.add(member.id);
    }
  }

  return [...ids];
}

export async function addMembersToThread(thread: ThreadChannel, userIds: string[]): Promise<void> {
  for (const userId of userIds) {
    try {
      await thread.members.add(userId);
    } catch (err) {
      console.warn(`[tickets] Failed to add user ${userId} to thread ${thread.id}:`, err);
    }
  }
}
