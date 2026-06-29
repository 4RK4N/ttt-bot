import { PermissionFlagsBits, type GuildMember } from 'discord.js';

/** Staff roles or guild Administrator — not the ticket opener by default. */
export function canStaffOrAdmin(member: GuildMember, staffRoleIds: string[]): boolean {
  if (staffRoleIds.some((roleId) => member.roles.cache.has(roleId))) return true;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}
