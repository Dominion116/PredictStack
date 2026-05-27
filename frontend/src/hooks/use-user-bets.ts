'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUserDashboard } from '@/api/users';

export function useUserBets(address: string | null) {
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserDashboard(address);
      setBets(data.positions ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load bets');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { bets, loading, error, refetch: fetch };
}
