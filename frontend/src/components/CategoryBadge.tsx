import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { parseMarketCategory } from '@/lib/format';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  // legacy lowercase keys
  crypto: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  sports: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  politics: 'bg-red-500/10 text-red-400 border-red-500/30',
  tech: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  finance: 'bg-green-500/10 text-green-400 border-green-500/30',
  culture: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  science: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  other: 'bg-muted text-muted-foreground border-border',
  // canonical capitalised keys
  Crypto: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  Politics: 'bg-red-500/10 text-red-400 border-red-500/30',
  Sports: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Science: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  Entertainment: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  Technology: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  Finance: 'bg-green-500/10 text-green-400 border-green-500/30',
  Other: 'bg-muted text-muted-foreground border-border',
};

interface CategoryBadgeProps {
  category?: string | null;
  className?: string;
  linkable?: boolean;
}

export function CategoryBadge({ category, className, linkable = false }: CategoryBadgeProps) {
  const parsed = parseMarketCategory(category);
  const color = CATEGORY_COLORS[category ?? ''] ?? CATEGORY_COLORS[parsed] ?? CATEGORY_COLORS.other;

  const badge = (
    <Badge
      variant="outline"
      className={cn('text-[10px] font-mono uppercase tracking-wide px-1.5 py-0', color, className)}
    >
      {parsed}
    </Badge>
  );

  if (linkable && category) {
    return (
      <Link href={`/explore/${encodeURIComponent(category.toLowerCase())}`} className="hover:opacity-80 transition-opacity">
        {badge}
      </Link>
    );
  }
  return badge;
}
