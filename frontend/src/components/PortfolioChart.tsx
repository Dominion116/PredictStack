'use client';

import { PnlPoint } from '@/api/analytics';

interface Props {
  series: PnlPoint[];
}

function formatMicro(micro: number) {
  return `${(micro / 1_000_000).toFixed(2)} STX`;
}

export function PortfolioChart({ series }: Props) {
  if (!series.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground border border-border rounded-lg">
        No P&L data yet — place your first bet to see your chart.
      </div>
    );
  }

  const values = series.map(p => p.cumulativeProfitMicro);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const W = 600;
  const H = 180;
  const pad = 8;

  const points = series.map((p, i) => {
    const x = pad + ((i / Math.max(series.length - 1, 1)) * (W - 2 * pad));
    const y = pad + ((1 - (p.cumulativeProfitMicro - min) / range) * (H - 2 * pad));
    return `${x},${y}`;
  });

  const zeroPct = 1 - (0 - min) / range;
  const zeroY = pad + zeroPct * (H - 2 * pad);
  const lastVal = values[values.length - 1];
  const color = lastVal >= 0 ? '#22c55e' : '#ef4444';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Cumulative P&L</span>
        <span className={lastVal >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
          {lastVal >= 0 ? '+' : ''}{formatMicro(lastVal)}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40 rounded-lg bg-muted/30 border border-border">
        {/* Zero line */}
        <line x1={pad} y1={zeroY} x2={W - pad} y2={zeroY} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="4 2" />
        {/* P&L line */}
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* First and last labels */}
        <text x={pad} y={H - 2} fontSize={9} fill="currentColor" opacity={0.5}>{series[0]?.date}</text>
        <text x={W - pad} y={H - 2} fontSize={9} fill="currentColor" opacity={0.5} textAnchor="end">
          {series[series.length - 1]?.date}
        </text>
      </svg>
    </div>
  );
}
