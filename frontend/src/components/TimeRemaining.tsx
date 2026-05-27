'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeRemainingProps {
  isoDate?: string | null;
  className?: string;
  showIcon?: boolean;
}

function resolveDisplay(isoDate: string): string {
  const d = new Date(isoDate);
  const diff = d.getTime() - Date.now();
  if (diff < 0) return `Ended ${d.toLocaleDateString()}`;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 60) return `Ends in ${mins}m`;
  if (hours < 24) return `Ends in ${hours}h`;
  return `Ends in ${days}d`;
}

export function TimeRemaining({ isoDate, className, showIcon = true }: TimeRemainingProps) {
  if (!isoDate) return null;

  const label = resolveDisplay(isoDate);
  const ended = label.startsWith('Ended');

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-mono', ended ? 'text-muted-foreground' : 'text-foreground', className)}>
      {showIcon && <Clock className="h-3 w-3 shrink-0" />}
      {label}
    </span>
  );
}
