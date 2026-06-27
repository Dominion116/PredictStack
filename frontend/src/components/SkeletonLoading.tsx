import { cn } from '@/lib/utils';

interface Props {
  count?: number;
  height?: 'sm' | 'md' | 'lg';
  width?: 'full' | 'half' | 'third' | 'quarter';
  className?: string;
}

const HEIGHT_CLASSES = {
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-5',
};

const WIDTH_CLASSES = {
  full: 'w-full',
  half: 'w-1/2',
  third: 'w-1/3',
  quarter: 'w-1/4',
};

export function SkeletonLoading({
  count = 1,
  height = 'md',
  width = 'full',
  className = '',
}: Props) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded bg-muted animate-pulse',
            HEIGHT_CLASSES[height],
            WIDTH_CLASSES[width],
          )}
        />
      ))}
    </div>
  );
}
