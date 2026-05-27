'use client';

import { useEffect, useState } from 'react';
import { getLeaderboardData, LeaderboardEntry } from '@/api/platform';

export function useLeaderboard(limit = 15) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getLeaderboardData(limit)
      .then(setEntries)
      .catch((err: any) => setError(err.message ?? 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [limit]);

  return { entries, loading, error };
}
