'use client';

import { useState } from 'react';
import { BACKEND_BASE_URL } from '@/lib/constants';

export function useExport(address: string | null | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadCsv() {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/${address}/export`);
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `predictstack-${address.slice(0, 8)}-bets.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message ?? 'Export failed');
    } finally {
      setLoading(false);
    }
  }

  return { downloadCsv, loading, error };
}
