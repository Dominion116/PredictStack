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
