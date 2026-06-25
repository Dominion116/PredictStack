'use client';

import { CreatorStats } from '@/api/creator';

interface Props {
  stats: CreatorStats;
}

export function CreatorStatsCard({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Markets Created', value: stats.marketsCreated },
        { label: 'Resolved', value: stats.marketsResolved },
        { label: 'Resolution Rate', value: `${stats.resolutionRate}%` },
        { label: 'Volume Generated', value: `${(stats.totalVolumeMicro / 1_000_000).toFixed(2)} STX` },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-xl font-bold font-mono">{value}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
