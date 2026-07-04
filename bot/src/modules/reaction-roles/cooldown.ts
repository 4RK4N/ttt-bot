const COOLDOWN_MS = 2000;
const TTL_MS = COOLDOWN_MS * 2;

const lastActionAt = new Map<string, number>();

function cooldownKey(userId: string, panelId: string): string {
  return `${userId}:${panelId}`;
}

function pruneStale(now: number): void {
  for (const [key, ts] of lastActionAt) {
    if (now - ts > TTL_MS) lastActionAt.delete(key);
  }
}

export function isOnCooldown(userId: string, panelId: string): boolean {
  const now = Date.now();
  const ts = lastActionAt.get(cooldownKey(userId, panelId));
  if (ts === undefined) return false;
  if (now - ts >= COOLDOWN_MS) {
    lastActionAt.delete(cooldownKey(userId, panelId));
    return false;
  }
  if (lastActionAt.size > 500) pruneStale(now);
  return true;
}

export function touchCooldown(userId: string, panelId: string): void {
  lastActionAt.set(cooldownKey(userId, panelId), Date.now());
}
