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
