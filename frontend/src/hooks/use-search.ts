'use client';

import { useState, useCallback, useRef } from 'react';
import { searchMarkets, SearchResult } from '@/api/search';
import { useDebounce } from './use-debounce';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const { markets } = await searchMarkets(q);
      setResults(markets);
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message ?? 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { query, setQuery, results, loading, error, runSearch, debouncedQuery };
}
