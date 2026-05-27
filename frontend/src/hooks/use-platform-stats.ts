'use client';

import { useEffect, useState } from 'react';
import { getPlatformStats } from '@/api/platform';

interface PlatformStats {
  'total-markets': number;
  'total-volume': number;
  'total-users': number;
  'active-markets': number;
}

const EMPTY: PlatformStats = {
  'total-markets': 0,
  'total-volume': 0,
  'total-users': 0,
  'active-markets': 0,
};

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformStats()
      .then(setStats)
      .catch(() => setStats(EMPTY))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}
