'use client';

import { useEffect, useState } from 'react';
import { backendFetch } from '@/api/client';
import { Gift } from 'lucide-react';

interface ReferralLeaderEntry {
  referrerAddress: string;
  referredCount: number;
  totalRewardsMicro: number;
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function LeaderboardReferralTab() {
  const [entries, setEntries] = useState<ReferralLeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch top referrers from backend — endpoint returns leaderboard sorted by referredCount
    backendFetch<{ entries: ReferralLeaderEntry[] }>('/api/referrals/leaderboard')
      .then(data => setEntries(data.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-muted" />)}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="text-center py-12">
        <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No referrals yet — share your link to appear here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <div
          key={entry.referrerAddress}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card"
        >
          <span className="text-sm font-bold font-mono text-muted-foreground w-6 text-center">
            {idx + 1}
          </span>
          <span className="flex-1 text-sm font-mono">{shortAddress(entry.referrerAddress)}</span>
          <span className="text-xs text-muted-foreground">{entry.referredCount} referred</span>
          <span className="text-xs font-medium text-primary font-mono">
            +{(entry.totalRewardsMicro / 1_000_000).toFixed(4)} STX
          </span>
        </div>
      ))}
    </div>
  );
}
