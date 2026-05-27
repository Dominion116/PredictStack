import { cn } from '@/lib/utils';

interface SkeletonRowProps {
  lines?: number;
  className?: string;
}

export function SkeletonRow({ lines = 3, className }: SkeletonRowProps) {
  const widths = ['w-16', 'w-3/4', 'w-1/2'];

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card p-5 animate-pulse', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn('h-3 rounded bg-muted', widths[i % widths.length])}
            />
          ))}
        </div>
        <div className="h-8 w-24 rounded-lg bg-muted shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonRows({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
