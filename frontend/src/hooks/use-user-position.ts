'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUserPosition } from '@/api/users';

interface UserPosition {
  'yes-amount': number;
  'no-amount': number;
  'total-wagered': number;
  claimed: boolean;
}

export function useUserPosition(address: string | null, marketId: number | null) {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!address || marketId === null) return;
    setLoading(true);
    try {
      const data = await getUserPosition(address, marketId);
      setPosition(data);
    } catch {
      setPosition(null);
    } finally {
      setLoading(false);
    }
  }, [address, marketId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { position, loading, refetch: fetch };
}
