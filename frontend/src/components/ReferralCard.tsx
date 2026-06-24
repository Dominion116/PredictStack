'use client';

import { useState } from 'react';
import { useReferral } from '@/hooks/use-referral';
import { Copy, Check, Gift } from 'lucide-react';

interface Props {
  address: string | null | undefined;
}

export function ReferralCard({ address }: Props) {
  const { stats, loading, error } = useReferral(address);
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  const referralUrl = stats?.code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/markets?ref=${stats.code}`
    : '';

  async function handleCopy() {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Refer a Friend</h3>
      </div>

      {loading && <div className="h-10 bg-muted animate-pulse rounded-lg" />}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <div className="text-xl font-bold font-mono">{stats.referredCount}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Friends Referred</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <div className="text-xl font-bold font-mono text-primary">
                {(stats.totalRewardsMicro / 1_000_000).toFixed(4)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">STX Earned</div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Your referral link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg truncate font-mono">
                {referralUrl}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                aria-label="Copy referral link"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground">
            You earn 1% of every bet placed by friends who sign up with your link.
          </p>
        </>
      )}
    </div>
  );
}
