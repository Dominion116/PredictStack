'use client';

import { cn } from '@/lib/utils';

interface TooltipWrapperProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function TooltipWrapper({ content, children, className }: TooltipWrapperProps) {
  return (
    <span className={cn('relative group cursor-default', className)} title={content}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center">
        <span className="rounded bg-popover border border-border px-2 py-1 text-xs font-mono text-popover-foreground shadow-md whitespace-nowrap">
          {content}
        </span>
      </span>
    </span>
  );
}
