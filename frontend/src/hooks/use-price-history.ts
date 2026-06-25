'use client';

import { useEffect, useState } from 'react';
import { getPriceHistory, PriceSnapshot, PriceRange } from '@/api/price-history';

export function usePriceHistory(marketId: number | string, range: PriceRange = 'all') {
  const [history, setHistory] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPriceHistory(marketId, range)
      .then(data => setHistory(data.history))
      .catch((err: any) => setError(err.message ?? 'Failed to load price history'))
      .finally(() => setLoading(false));
  }, [marketId, range]);

  return { history, loading, error };
}
