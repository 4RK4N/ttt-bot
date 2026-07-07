import type { WebConfig } from "./config.js";
import { fetchGuildRolesRaw, type RawGuildRole } from "./discordCache.js";

export interface GuildRole {
  id: string;
  name: string;
  color: number;
}

export async function listGuildRoles(cfg: WebConfig): Promise<GuildRole[]> {
  const raw = await fetchGuildRolesRaw(cfg);
  return raw
    .filter(
      (r): r is Required<Pick<RawGuildRole, "id" | "name">> & RawGuildRole =>
        typeof r.id === "string" &&
        typeof r.name === "string" &&
        r.name !== "@everyone" &&
        r.managed !== true,
    )
    .sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
    .map((r) => ({ id: r.id, name: r.name, color: r.color ?? 0 }));
}
