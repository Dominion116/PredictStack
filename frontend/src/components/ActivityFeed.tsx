'use client';

import { useActivityFeed } from '@/hooks/use-activity-feed';
import { ActivityItem } from './ActivityItem';

interface Props {
  limit?: number;
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3 border-b border-border animate-pulse">
          <div className="w-6 h-6 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
          <div className="h-3 bg-muted rounded w-12" />
        </div>
      ))}
    </div>
  );
}

export function ActivityFeed({ limit = 20 }: Props) {
  const { activities, total, page, loading, error, goToPage } = useActivityFeed(limit);

  if (loading && activities.length === 0) return <ActivitySkeleton />;

  if (error) {
    return (
      <p className="text-sm text-destructive py-6 text-center">
        Failed to load activity: {error}
      </p>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        No activity yet. Be the first to place a bet!
      </p>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="divide-y divide-border">
        {activities.map(event => (
          <ActivityItem key={event._id} event={event} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            disabled={page <= 1 || loading}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            disabled={page >= totalPages || loading}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
