'use client';

import { CategoryBreakdownItem } from '@/api/analytics';

interface Props {
  items: CategoryBreakdownItem[];
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export function CategoryBreakdown({ items }: Props) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No category data yet.
      </p>
    );
  }

  const totalMicro = items.reduce((s, i) => s + i.totalMicro, 0) || 1;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Bets by Category</p>
      {items.map((item, idx) => {
        const pct = Math.round((item.totalMicro / totalMicro) * 100);
        const color = COLORS[idx % COLORS.length];
        return (
          <div key={item.category} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{item.category}</span>
              <span className="text-muted-foreground">{item.count} bet{item.count !== 1 ? 's' : ''} · {pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
