import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: boolean;
  className?: string;
}

export function StatBadge({ label, value, icon: Icon, accent, className }: Props) {
  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border border-border text-xs',
        accent ? 'bg-primary/5 border-primary/30' : 'bg-muted/30',
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
