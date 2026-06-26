export function formatMicroSTX(micro: number | string): string {
  const stx = Number(micro) / 1_000_000;
  if (stx >= 1_000_000) return `${(stx / 1_000_000).toFixed(2)}M STX`;
  if (stx >= 1_000) return `${(stx / 1_000).toFixed(2)}k STX`;
  return `${stx.toFixed(4)} STX`;
}

export function formatVolume(micro: number | string): string {
  const stx = Number(micro) / 1_000_000;
  if (stx >= 1_000_000) return `${(stx / 1_000_000).toFixed(1)}M`;
  if (stx >= 1_000) return `${(stx / 1_000).toFixed(1)}k`;
  return stx.toFixed(0);
}

export function formatProbability(yesPool: number, noPool: number): string {
  const total = yesPool + noPool;
  if (total === 0) return '50%';
  const pct = Math.round((yesPool / total) * 100);
  return `${pct}%`;
}

export function calculateOdds(stake: number, winningPool: number, losingPool: number): number {
  if (winningPool === 0) return 0;
  const share = (stake / winningPool) * losingPool;
  return stake + share;
}

export function truncateAddress(address: string, prefixLen = 6, suffixLen = 4): string {
  if (address.length <= prefixLen + suffixLen) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

export function formatWinRate(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return '—';
  return `${Math.round((wins / total) * 100)}%`;
}

export function isMarketActive(status: string): boolean {
  return status === 'active';
}

export function getMarketStatus(status: string): 'active' | 'resolved' | 'cancelled' | 'unknown' {
  if (status === 'active') return 'active';
  if (status === 'resolved') return 'resolved';
  if (status === 'cancelled') return 'cancelled';
  return 'unknown';
}

const KNOWN_CATEGORIES = ['crypto', 'sports', 'politics', 'tech', 'finance', 'culture', 'science', 'other'] as const;
export type MarketCategory = typeof KNOWN_CATEGORIES[number];

export function parseMarketCategory(raw: string | undefined | null): MarketCategory {
  const lower = (raw ?? '').toLowerCase().trim() as MarketCategory;
  return KNOWN_CATEGORIES.includes(lower) ? lower : 'other';
}

/**
 * Format a number of basis points (0–10000) as a percentage string.
 * @example bpsToPercent(5500) // "55.0%"
 */
export function bpsToPercent(bps: number, decimals = 1): string {
  return `${(bps / 100).toFixed(decimals)}%`;
}

/**
 * Format a Unix epoch timestamp (ms) as a relative time string.
 */
export function relativeTime(timestamp: number | string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Clamp a number between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert STX to microSTX.
 */
export function stxToMicro(stx: number): number {
  return Math.round(stx * 1_000_000);
}
