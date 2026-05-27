import { formatVolume } from '@/lib/format';
import { cn } from '@/lib/utils';

interface VolumeDisplayProps {
  yesPool: number;
  noPool: number;
  className?: string;
  showLabel?: boolean;
}

export function VolumeDisplay({ yesPool, noPool, className, showLabel = true }: VolumeDisplayProps) {
  const totalMicro = (yesPool ?? 0) + (noPool ?? 0);
  const formatted = formatVolume(totalMicro);

  return (
    <span className={cn('font-mono text-sm', className)}>
      {formatted}
      {showLabel && <span className="text-muted-foreground text-xs ml-1">STX</span>}
    </span>
  );
}
