'use client';

import { useEffect, useState, useCallback } from 'react';
import { getActivityFeed, ActivityEvent } from '@/api/feed';

const POLL_INTERVAL_MS = 30_000;

export function useActivityFeed(limit = 20) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivityFeed(p, limit);
      setActivities(data.activities);
      setTotal(data.total);
      setPage(p);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPage(1);
    const id = setInterval(() => fetchPage(1), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchPage]);

  return { activities, total, page, loading, error, goToPage: fetchPage };
}
