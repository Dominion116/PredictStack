'use client';

import { useCategories } from '@/hooks/use-categories';
import { CategoryBadge } from './CategoryBadge';
import { cn } from '@/lib/utils';

interface Props {
  selected: string | null;
  onChange: (category: string | null) => void;
}

export function CategoryFilterPills({ selected, onChange }: Props) {
  const { categories, loading } = useCategories();

  if (loading) return <div className="h-6 w-40 rounded-full bg-muted animate-pulse" />;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={cn(
          'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
          selected === null
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted text-muted-foreground border-border hover:border-foreground',
        )}
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat.name}
          onClick={() => onChange(cat.name === selected ? null : cat.name)}
          className={cn(
            'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            cat.name === selected
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted text-muted-foreground border-border hover:border-foreground',
          )}
        >
          {cat.name}
          {cat.count > 0 && (
            <span className="opacity-60">({cat.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
