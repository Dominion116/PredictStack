'use client';

import { useAnalytics } from '@/hooks/use-analytics';
import { PortfolioChart } from '@/components/PortfolioChart';
import { WinRateChart } from '@/components/WinRateChart';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { isUserSignedIn, getUserAddress } from '@/lib/constants';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-40 rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const address = isUserSignedIn() ? getUserAddress() : null;
  const { data, loading, error } = useAnalytics(address);

  if (!address) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Connect your wallet to view your portfolio analytics.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your prediction performance at a glance.
        </p>
      </div>

      {loading && <AnalyticsSkeleton />}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <>
          <SectionCard title="Cumulative P&L">
            <PortfolioChart series={data.pnlSeries} />
          </SectionCard>
          <SectionCard title="Win Rate">
            <WinRateChart stats={data.winRate} />
          </SectionCard>
          <SectionCard title="Bets by Category">
            <CategoryBreakdown items={data.categoryBreakdown} />
          </SectionCard>
        </>
      )}
    </main>
  );
}
