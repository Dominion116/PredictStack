'use client';

import { WinRateStats } from '@/api/analytics';

interface Props {
  stats: WinRateStats;
}

export function WinRateChart({ stats }: Props) {
  const { wins, losses, winRate, totalBets, resolvedBets } = stats;
  const total = wins + losses;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Win Rate</span>
        <span className="text-foreground font-medium">{winRate.toFixed(1)}%</span>
      </div>

      {/* Bar */}
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        {total > 0 && (
          <div
            className="h-full bg-green-500 transition-all duration-700"
            style={{ width: `${winRate}%` }}
          />
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Bets', value: totalBets },
          { label: 'Wins', value: wins, color: 'text-green-500' },
          { label: 'Losses', value: losses, color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg bg-muted/40 p-3 text-center">
            <div className={`text-xl font-bold font-mono ${color ?? 'text-foreground'}`}>{value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {resolvedBets === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Win rate calculated once markets resolve.
        </p>
      )}
    </div>
  );
}
