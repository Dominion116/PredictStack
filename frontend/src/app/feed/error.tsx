'use client';

import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  error: Error;
  reset: () => void;
}

export default function FeedError({ error, reset }: Props) {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
      <div>
        <p className="text-sm font-medium">Failed to load activity feed</p>
        <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
      >
        <RefreshCcw className="h-3.5 w-3.5" />
        Try again
      </button>
    </main>
  );
}
