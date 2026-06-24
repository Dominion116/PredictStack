'use client';

import { AuditEntry } from '@/api/admin';

function shortAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ACTION_LABELS: Record<string, string> = {
  market_created: 'Market Created',
  market_resolved: 'Market Resolved',
  market_cancelled: 'Market Cancelled',
  bulk_resolved: 'Bulk Resolved',
};

interface Props {
  entries: AuditEntry[];
  loading?: boolean;
}

export function AuditLogTable({ entries, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-muted rounded-lg" />)}
      </div>
    );
  }

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No audit entries yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 pr-3 font-medium">Action</th>
            <th className="text-left py-2 pr-3 font-medium">Actor</th>
            <th className="text-left py-2 pr-3 font-medium">Target</th>
            <th className="text-right py-2 font-medium">When</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry._id} className="border-b border-border/50 hover:bg-muted/20">
              <td className="py-2 pr-3 font-medium">{ACTION_LABELS[entry.action] ?? entry.action}</td>
              <td className="py-2 pr-3 font-mono text-muted-foreground">{shortAddress(entry.actorAddress)}</td>
              <td className="py-2 pr-3 font-mono text-muted-foreground">{entry.targetId ?? '—'}</td>
              <td className="py-2 text-right text-muted-foreground">{relativeTime(entry.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
