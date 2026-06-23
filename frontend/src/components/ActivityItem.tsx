'use client';

import { ActivityEvent } from '@/api/feed';
import { formatDistanceToNow } from 'date-fns';

const TYPE_LABELS: Record<string, string> = {
  bet_placed: 'placed a bet',
  market_created: 'created a market',
  market_resolved: 'resolved a market',
  claim_made: 'claimed winnings',
};

const TYPE_ICONS: Record<string, string> = {
  bet_placed: '🎯',
  market_created: '🏗️',
  market_resolved: '✅',
  claim_made: '💰',
};

function shortAddress(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatAmount(micro: number) {
  return `${(micro / 1_000_000).toFixed(2)} STX`;
}

interface Props {
  event: ActivityEvent;
}

export function ActivityItem({ event }: Props) {
  const label = TYPE_LABELS[event.type] ?? event.type;
  const icon = TYPE_ICONS[event.type] ?? '📌';
  const meta = event.meta as any;

  let detail = '';
  if (event.type === 'bet_placed' && meta.amountMicro) {
    detail = `${formatAmount(meta.amountMicro)} on ${meta.outcome ? 'YES' : 'NO'}`;
  } else if (event.type === 'claim_made' && meta.amountMicro) {
    detail = formatAmount(meta.amountMicro);
  } else if (event.type === 'market_resolved') {
    detail = `outcome: ${meta.winningOutcome ? 'YES' : 'NO'}`;
  }

  const timeAgo = formatDistanceToNow(new Date(event.createdAt), { addSuffix: true });

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <span className="text-xl mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-medium font-mono">{shortAddress(event.actorAddress)}</span>
          {' '}
          <span className="text-muted-foreground">{label}</span>
          {event.marketQuestion && (
            <span className="text-foreground"> — {event.marketQuestion}</span>
          )}
        </p>
        {detail && (
          <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
        )}
      </div>
      <time className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</time>
    </div>
  );
}
