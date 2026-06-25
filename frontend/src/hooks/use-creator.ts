'use client';

import { useEffect, useState } from 'react';
import { getCreatorStats, getCreatedMarkets, CreatorStats } from '@/api/creator';

export function useCreator(address: string | null | undefined) {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    Promise.all([getCreatorStats(address), getCreatedMarkets(address)])
      .then(([s, m]) => { setStats(s); setMarkets(m.markets); })
      .catch((err: any) => setError(err.message ?? 'Failed to load creator data'))
      .finally(() => setLoading(false));
  }, [address]);

  return { stats, markets, loading, error };
}
