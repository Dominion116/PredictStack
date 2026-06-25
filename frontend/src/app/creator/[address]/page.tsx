'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCreator } from '@/hooks/use-creator';
import { CreatorStatsCard } from '@/components/CreatorStatsCard';
import { CategoryBadge } from '@/components/CategoryBadge';
import { MarketStatusBadge } from '@/components/MarketStatusBadge';
import { BackButton } from '@/components/BackButton';
import { useBnsName } from '@/hooks/use-bns-name';

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function CreatorPage() {
  const { address } = useParams<{ address: string }>();
  const { stats, markets, loading, error } = useCreator(address);
  const bnsName = useBnsName(address);
  const displayName = bnsName ?? shortAddress(address);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <BackButton href="/markets" label="Markets" />
      </div>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold font-mono">
          {address.slice(2, 4).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{displayName}</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{address}</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      )}

      {stats && <CreatorStatsCard stats={stats} />}

      {markets.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Markets Created ({markets.length})
          </h2>
          <div className="space-y-2">
            {markets.map((m: any) => (
              <Link
                key={m.id}
                href={`/market/${m.contractMarketId}`}
                className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{m.question}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.category && <CategoryBadge category={m.category} />}
                  <MarketStatusBadge status={m.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && markets.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          This creator has not created any markets yet.
        </p>
      )}
    </main>
  );
}
