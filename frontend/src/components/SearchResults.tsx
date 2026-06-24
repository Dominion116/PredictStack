'use client';

import Link from 'next/link';
import { SearchResult } from '@/api/search';
import { CategoryBadge } from './CategoryBadge';
import { MarketStatusBadge } from './MarketStatusBadge';

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200/30 rounded px-0.5">{part}</mark> : part
  );
}

interface Props {
  results: SearchResult[];
  query: string;
  loading: boolean;
  error: string | null;
}

export function SearchResults({ results, query, loading, error }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;

  if (query && results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No markets found for &ldquo;{query}&rdquo;
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {results.map(market => (
        <Link
          key={market.id}
          href={`/market/${market.contractMarketId}`}
          className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">
              {highlightMatch(market.question, query)}
            </p>
            {market.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {highlightMatch(market.description, query)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CategoryBadge category={market.category} />
            <MarketStatusBadge status={market.status as any} />
          </div>
        </Link>
      ))}
    </div>
  );
}
