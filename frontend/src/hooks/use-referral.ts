'use client';

import { useCallback, useEffect, useState } from 'react';
import { generateReferralCode, getReferralStats, ReferralStats } from '@/api/referrals';

export function useReferral(address: string | null | undefined) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await getReferralStats(address);
      setStats(data);
    } catch {
      // No referral yet — generate one
      try {
        const data = await generateReferralCode(address);
        setStats(data);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load referral');
      }
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}
