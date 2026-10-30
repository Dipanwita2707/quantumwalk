const STORAGE_KEY = "qw_discovery_explored";

export function readGuestDiscoveryExplored(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw === null ? 0 : Number(raw);
    if (!Number.isFinite(n)) return 0;
    return Math.min(4, Math.max(0, Math.floor(n)));
  } catch {
    return 0;
  }
}

/** Mirrors POST /api/discovery/progress scoring for unsigned /start completion. */
export function guestIntroductionProgress(): { explored: number; score: number; done: boolean } {
  const explored = readGuestDiscoveryExplored();
  const score = Math.min(explored * 25, 100);
  return { explored, score, done: score === 100 };
}
