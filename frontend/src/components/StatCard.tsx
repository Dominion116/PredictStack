import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: boolean;
  className?: string;
}

export function StatCard({ label, value, sub, icon: Icon, accent = false, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-border/60 bg-card p-5 overflow-hidden group hover:border-primary/30 transition-colors duration-300',
        className,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div className={`text-2xl font-bold font-mono ${accent ? 'text-primary' : ''}`}>{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      <div className="absolute bottom-0 right-0 w-16 h-16 rounded-tl-3xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
