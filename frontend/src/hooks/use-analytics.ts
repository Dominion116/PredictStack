'use client';

import { useEffect, useState } from 'react';
import { getUserAnalytics, UserAnalytics } from '@/api/analytics';

export function useAnalytics(address: string | null | undefined) {
  const [data, setData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);
    getUserAnalytics(address)
      .then(setData)
      .catch((err: any) => setError(err.message ?? 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [address]);

  return { data, loading, error };
}
