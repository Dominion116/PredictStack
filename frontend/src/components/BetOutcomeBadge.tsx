import { cn } from '@/lib/utils';

interface BetOutcomeBadgeProps {
  outcome: 'YES' | 'NO' | boolean;
  className?: string;
}

export function BetOutcomeBadge({ outcome, className }: BetOutcomeBadgeProps) {
  const isYes = outcome === 'YES' || outcome === true;

  return (
    <span
      className={cn(
        'text-xs font-mono font-bold',
        isYes ? 'text-green-500' : 'text-red-500',
        className,
      )}
    >
      {isYes ? 'YES' : 'NO'}
    </span>
  );
}
