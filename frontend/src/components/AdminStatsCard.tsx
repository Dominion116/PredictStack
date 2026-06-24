'use client';

import { DailyAdminStat } from '@/api/admin';

interface Props {
  days: DailyAdminStat[];
}

export function AdminStatsCard({ days }: Props) {
  const totals = days.reduce(
    (acc, d) => ({
      bets: acc.bets + d.bets,
      volumeMicro: acc.volumeMicro + d.volumeMicro,
      newUsers: acc.newUsers + d.newUsers,
    }),
    { bets: 0, volumeMicro: 0, newUsers: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Bets (7d)', value: totals.bets },
          { label: 'Volume (7d)', value: `${(totals.volumeMicro / 1_000_000).toFixed(2)} STX` },
          { label: 'New Users (7d)', value: totals.newUsers },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="text-2xl font-bold font-mono">{value}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Sparkline bars */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Daily Bet Volume (7d)</p>
        <div className="flex items-end gap-1 h-16">
          {days.map(d => {
            const maxVol = Math.max(...days.map(x => x.volumeMicro), 1);
            const pct = Math.max((d.volumeMicro / maxVol) * 100, 2);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/60 rounded-t"
                  style={{ height: `${pct}%` }}
                  title={`${d.date}: ${(d.volumeMicro / 1_000_000).toFixed(2)} STX`}
                />
                <span className="text-[8px] text-muted-foreground">{d.date.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
