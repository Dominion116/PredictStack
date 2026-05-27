'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMarket } from '@/api/markets';

export function useMarket(marketId: number | null) {
  const [market, setMarket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (marketId === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMarket(marketId);
      setMarket(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load market');
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { market, loading, error, refetch: fetch };
}
