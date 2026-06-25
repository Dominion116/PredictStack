'use client';

import { useState } from 'react';
import { useTransactions } from '@/hooks/use-transactions';
import { History, X, ExternalLink } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  success: 'text-green-500',
  abort_by_response: 'text-red-500',
  abort_by_post_condition: 'text-red-500',
  pending: 'text-yellow-500',
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  address: string | null | undefined;
  network?: 'mainnet' | 'testnet';
}

export function TransactionDrawer({ address, network = 'mainnet' }: Props) {
  const [open, setOpen] = useState(false);
  const { transactions, loading } = useTransactions(address, network);

  if (!address) return null;

  const explorerBase = network === 'mainnet'
    ? 'https://explorer.hiro.so/txid'
    : 'https://explorer.hiro.so/txid?chain=testnet';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Recent transactions"
        className="p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <History className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-background shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background">
            <span className="text-sm font-semibold">Recent Transactions</span>
            <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <div className="p-2 space-y-1">
            {loading && <p className="text-xs text-muted-foreground text-center py-6">Loading…</p>}
            {!loading && transactions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No transactions found.</p>
            )}
            {transactions.map(tx => (
              <a
                key={tx.tx_id}
                href={`${explorerBase}/${tx.tx_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate">{tx.tx_id.slice(0, 14)}…</p>
                  <p className={`text-[10px] mt-0.5 ${STATUS_COLORS[tx.tx_status] ?? 'text-muted-foreground'}`}>
                    {tx.tx_status} · {tx.tx_type}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {relativeTime(tx.burn_block_time_iso)}
                  </span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
