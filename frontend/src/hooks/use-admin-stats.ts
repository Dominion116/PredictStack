'use client';

import { useEffect, useState } from 'react';
import { getAdminStats, getAuditLog, AdminStats, AuditLogResponse } from '@/api/admin';

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err: any) => setError(err.message ?? 'Failed to load admin stats'))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}

export function useAuditLog(page = 1) {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAuditLog(page)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page]);

  return { data, loading };
}
