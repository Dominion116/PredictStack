import { Badge } from '@/components/ui/badge';
import { getMarketStatus } from '@/lib/format';
import { cn } from '@/lib/utils';

interface MarketStatusBadgeProps {
  status: string;
  className?: string;
}

const labels: Record<string, string> = {
  active: 'LIVE',
  resolved: 'RESOLVED',
  cancelled: 'CANCELLED',
  unknown: 'UNKNOWN',
};

const styles: Record<string, string> = {
  active: 'text-green-500 border-green-500/40',
  resolved: 'text-primary border-primary/40',
  cancelled: 'text-muted-foreground border-border',
  unknown: 'text-muted-foreground border-border',
};

export function MarketStatusBadge({ status, className }: MarketStatusBadgeProps) {
  const normalized = getMarketStatus(status);

  return (
    <Badge
      variant="outline"
      className={cn('text-[10px] font-mono px-1.5 py-0 border-border/80', styles[normalized], className)}
    >
      {labels[normalized]}
    </Badge>
  );
}
