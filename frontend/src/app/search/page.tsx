'use client';

import { useEffect } from 'react';
import { useSearch } from '@/hooks/use-search';
import { SearchResults } from '@/components/SearchResults';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const { query, setQuery, results, loading, error, runSearch, debouncedQuery } = useSearch();

  useEffect(() => {
    runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search Markets</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Find prediction markets by question or description.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          autoFocus
          placeholder="Search markets…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {query && (
        <p className="text-xs text-muted-foreground">
          {loading ? 'Searching…' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
        </p>
      )}

      <SearchResults results={results} query={debouncedQuery} loading={loading && query.length > 0} error={error} />

      {!query && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Type to search all prediction markets.
        </p>
      )}
    </main>
  );
}
