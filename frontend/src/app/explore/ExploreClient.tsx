'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMarkets } from '@/api/markets';
import { MarketCard, MarketCardSkeleton } from '@/components/market-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, Search, ChevronLeft, ChevronRight, TrendingUp, Clock, Flame } from 'lucide-react';

const ITEMS_PER_PAGE = 9;

function toMarketShape(m: any) {
  return {
    id: m.contractMarketId ?? m.id,
    backendId: m.id,
    question: m.question,
    description: m.description,
    category: m.category,
    'resolve-time-iso': m.resolveTimeIso,
    'yes-pool': m.yesPoolMicro,
    'no-pool': m.noPoolMicro,
    status: m.status,
    creator: m.chain?.creator ?? m.createdBy,
    totalBets: m.totalBets,
    winningOutcome: m.winningOutcome,
    marketRef: m.marketRef,
  };
}

export function ExploreClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allMarkets, setAllMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters from URL
  const status = searchParams.get('status') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const search = searchParams.get('search') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';

  function pushParam(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.replace(`/explore?${params.toString()}`, { scroll: false });
    setCurrentPage(1);
  }

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, string> = { limit: '200' };
      if (status) filters.status = status;
      if (sort) filters.sort = sort;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      const data = await getMarkets(filters) as any;
      setAllMarkets((data.markets ?? []).map(toMarketShape));
    } catch {
      setError('Failed to load markets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, sort, dateFrom, dateTo]);

  useEffect(() => { loadMarkets(); }, [loadMarkets]);

  // Client-side search filter (debounced via URL param)
  const filtered = allMarkets.filter(m =>
    !search || m.question?.toLowerCase().includes(search.toLowerCase())
  );

  // Trending: top 3 by total pool volume (from all markets, not current filtered set)
  const trending = [...allMarkets]
    .sort((a, b) => (Number(b['yes-pool']) + Number(b['no-pool'])) - (Number(a['yes-pool']) + Number(a['no-pool'])))
    .slice(0, 3);

  // Ending soon: next 3 active markets with closest resolve date
  const endingSoon = [...allMarkets]
    .filter(m => m.status === 'active' && m['resolve-time-iso'])
    .sort((a, b) => new Date(a['resolve-time-iso']).getTime() - new Date(b['resolve-time-iso']).getTime())
    .slice(0, 3);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Debounced search
  const [searchDraft, setSearchDraft] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => pushParam({ search: searchDraft }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Markets</h1>
          <p className="text-muted-foreground mt-1">Browse, filter, and discover prediction markets.</p>
        </div>

        {/* Trending section */}
        {!loading && trending.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-4 w-4 text-orange-500" />
              <h2 className="text-lg font-semibold">Trending</h2>
              <Badge variant="secondary" className="text-xs">by volume</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trending.map((m, i) => <MarketCard key={m.id} market={m} index={i} />)}
            </div>
          </section>
        )}

        {/* Ending soon section */}
        {!loading && endingSoon.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-yellow-500" />
              <h2 className="text-lg font-semibold">Ending Soon</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {endingSoon.map((m, i) => <MarketCard key={m.id} market={m} index={i} />)}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> All Markets
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="explore-search"
                placeholder="Search markets…"
                className="pl-9"
                value={searchDraft}
                onChange={e => setSearchDraft(e.target.value)}
                aria-label="Search prediction markets"
              />
            </div>

            {/* Status filter */}
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={e => pushParam({ status: e.target.value })}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Sort */}
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={sort}
              onChange={e => pushParam({ sort: e.target.value })}
            >
              <option value="newest">Newest</option>
              <option value="volume">Volume</option>
              <option value="ending">Ending Soon</option>
            </select>

            {/* Date range */}
            <Input
              type="date"
              className="h-9 w-auto"
              title="Resolve date from"
              value={dateFrom}
              onChange={e => pushParam({ dateFrom: e.target.value })}
            />
            <Input
              type="date"
              className="h-9 w-auto"
              title="Resolve date to"
              value={dateTo}
              onChange={e => pushParam({ dateTo: e.target.value })}
            />

            {(status || search || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchDraft(''); pushParam({ status: '', search: '', dateFrom: '', dateTo: '' }); }}
              >
                Clear
              </Button>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <MarketCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-destructive font-medium">{error}</p>
              <Button variant="outline" onClick={loadMarkets}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed rounded-xl p-12 text-center text-muted-foreground">
              No markets match your filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginated.map((m, i) => <MarketCard key={m.id} market={m} index={i} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Button key={p} variant={currentPage === p ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setCurrentPage(p)}>
                      {p}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
