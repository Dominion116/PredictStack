import { formatProbability } from '@/lib/format';
import { cn } from '@/lib/utils';

interface OddsDisplayProps {
  yesPool: number;
  noPool: number;
  className?: string;
  showBoth?: boolean;
}

export function OddsDisplay({ yesPool, noPool, className, showBoth = true }: OddsDisplayProps) {
  const yesPct = formatProbability(yesPool, noPool);
  const total = yesPool + noPool;
  const noRaw = total === 0 ? 50 : Math.round((noPool / total) * 100);
  const noPct = `${noRaw}%`;

  if (!showBoth) {
    return (
      <span className={cn('font-mono text-sm font-semibold text-green-500', className)}>
        YES {yesPct}
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 text-xs font-mono', className)}>
      <span className="text-green-500 font-semibold">YES {yesPct}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-red-500 font-semibold">NO {noPct}</span>
    </div>
  );
}
