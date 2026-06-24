import { Suspense } from 'react';
import { CategoryBadge } from '@/components/CategoryBadge';
import { BackButton } from '@/components/BackButton';

interface Props {
  params: { category: string };
}

export function generateMetadata({ params }: Props) {
  const name = decodeURIComponent(params.category);
  const display = name.charAt(0).toUpperCase() + name.slice(1);
  return {
    title: `${display} Markets — PredictStack`,
    description: `Browse all ${display} prediction markets on PredictStack.`,
  };
}

export default function CategoryPage({ params }: Props) {
  const raw = decodeURIComponent(params.category);
  const displayName = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <BackButton href="/explore" label="Explore" />
        <CategoryBadge category={displayName} />
        <h1 className="text-xl font-bold">{displayName} Markets</h1>
      </div>

      <Suspense fallback={<div className="h-40 rounded-xl bg-muted animate-pulse" />}>
        <CategoryMarketsClient category={displayName} />
      </Suspense>
    </main>
  );
}

function CategoryMarketsClient({ category }: { category: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      Showing all <strong>{category}</strong> markets — filter is applied via{' '}
      <code>/api/markets?category={category}</code>.
    </p>
  );
}
