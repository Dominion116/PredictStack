'use client';

import { useState } from 'react';
import { usePriceHistory } from '@/hooks/use-price-history';
import { PriceRange } from '@/api/price-history';

const RANGES: { label: string; value: PriceRange }[] = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '24H', value: '24h' },
  { label: 'All', value: 'all' },
];

interface Props {
  marketId: number | string;
}

export function PriceHistoryChart({ marketId }: Props) {
  const [range, setRange] = useState<PriceRange>('all');
  const { history, loading } = usePriceHistory(marketId, range);

  if (loading) return <div className="h-32 rounded-xl bg-muted animate-pulse" />;

  if (!history.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        No price history yet — snapshots are recorded every 5 minutes.
      </p>
    );
  }

  const W = 600;
  const H = 120;
  const pad = 8;
  const min = 0;
  const max = 10_000;

  const yesPoints = history.map((p, i) => {
    const x = pad + (i / Math.max(history.length - 1, 1)) * (W - 2 * pad);
    const y = pad + (1 - (p.yes - min) / (max - min)) * (H - 2 * pad);
    return `${x},${y}`;
  });

  const noPoints = history.map((p, i) => {
    const x = pad + (i / Math.max(history.length - 1, 1)) * (W - 2 * pad);
    const y = pad + (1 - (p.no - min) / (max - min)) * (H - 2 * pad);
    return `${x},${y}`;
  });

  const lastYes = (history[history.length - 1]?.yes ?? 5000) / 100;
  const lastNo  = (history[history.length - 1]?.no  ?? 5000) / 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-green-500 inline-block" />
            YES {lastYes.toFixed(1)}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-red-500 inline-block" />
            NO {lastNo.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2 py-0.5 text-[10px] rounded font-mono transition-colors ${
                range === r.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28 rounded-lg bg-muted/20 border border-border">
        <polyline points={yesPoints.join(' ')} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinejoin="round" />
        <polyline points={noPoints.join(' ')}  fill="none" stroke="#ef4444" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </div>
  );
}
