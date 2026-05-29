'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TimeRemaining } from '@/components/TimeRemaining';
import { CategoryBadge } from '@/components/CategoryBadge';
import { MarketStatusBadge } from '@/components/MarketStatusBadge';

interface MarketCardProps {
    market: any;
    index?: number;
}

export function MarketCard({ market, index = 0 }: MarketCardProps) {
    const question = market.question || 'Unknown Market';
    const [copied, setCopied] = useState(false);
    const isoDate = market['resolve-time-iso'] ?? market.resolveTimeIso ?? null;

    function copyRef() {
        const ref = market.marketRef || market['market-ref'];
        if (!ref) return;
        navigator.clipboard.writeText(ref).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    // Pool numbers come straight from getMergedMarketByContractId on the backend:
    // max(on-chain pool, backend confirmed bets). Always real data.
    const yesPool   = Number(market['yes-pool'] ?? 0) / 1_000_000;
    const noPool    = Number(market['no-pool']  ?? 0) / 1_000_000;
    const totalPool = yesPool + noPool;

    // Standard CPMM-style implied probabilities and payout multipliers.
    // Display 50/50 + 2.00x only when no bets exist yet (mathematical default,
    // not mock data).
    const yesMultiplier = yesPool > 0 ? (totalPool / yesPool).toFixed(2) : '2.00';
    const noMultiplier  = noPool  > 0 ? (totalPool / noPool).toFixed(2)  : '2.00';
    const yesPercent    = totalPool > 0 ? (yesPool / totalPool) * 100 : 50;
    const noPercent     = 100 - yesPercent;

    const volumeDisplay = totalPool >= 1000
        ? `${(totalPool / 1000).toFixed(1)}k`
        : totalPool.toFixed(2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.07 }}
            whileHover={{ y: -3 }}
            className="h-full"
        >
            {/* Screen-reader announcement for copy action */}
            <span role="status" aria-live="polite" className="sr-only">
                {copied ? 'Market ref copied to clipboard' : ''}
            </span>
            <div className="group relative flex flex-col h-full rounded-xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">

                {/* Top accent line — animates to primary on hover */}
                <div className="h-px w-full bg-border group-hover:bg-primary/60 transition-colors duration-300" />

                {/* Header */}
                <div className="px-5 pt-5 pb-4 space-y-3 flex-1">

                    {/* Category + status indicator */}
                    <div className="flex items-center justify-between">
                        <CategoryBadge category={market.category} />
                        <MarketStatusBadge status={market.status ?? 'active'} />
                    </div>

                    {/* Question */}
                    <p className="font-semibold text-[15px] leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
                        {question}
                    </p>

                    {/* Probability bars */}
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2.5">
                            <span className="text-[11px] font-mono text-green-500 w-6 shrink-0">YES</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-green-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${yesPercent}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.07 + 0.2, ease: 'easeOut' }}
                                />
                            </div>
                            <span className="text-[11px] font-mono text-green-500 w-9 text-right shrink-0">
                                {yesPercent.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-[11px] font-mono text-red-500 w-6 shrink-0">NO</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-red-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${noPercent}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.07 + 0.2, ease: 'easeOut' }}
                                />
                            </div>
                            <span className="text-[11px] font-mono text-red-500 w-9 text-right shrink-0">
                                {noPercent.toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Multipliers + volume */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-2.5 text-center">
                            <div className="text-base font-bold font-mono text-green-500 leading-none">
                                {yesMultiplier}x
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">YES pays</div>
                        </div>

                        <div className="rounded-lg bg-muted/60 border border-border p-2.5 text-center">
                            <div className="text-base font-bold font-mono leading-none">${volumeDisplay}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">volume</div>
                        </div>

                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-center">
                            <div className="text-base font-bold font-mono text-red-500 leading-none">
                                {noMultiplier}x
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">NO pays</div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono mb-3">
                        <TimeRemaining isoDate={isoDate} />
                        <span className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {market.totalBets ?? 0} bets
                            </span>
                            {(market.marketRef || market['market-ref']) && (
                                <button
                                    onClick={copyRef}
                                    title="Copy market ref"
                                    aria-label={copied ? 'Market ref copied' : 'Copy market ref'}
                                    className="flex items-center gap-0.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
                                >
                                    {copied
                                        ? <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
                                        : <Copy className="h-3 w-3" aria-hidden="true" />
                                    }
                                </button>
                            )}
                        </span>
                    </div>

                    <Link href={`/market/${market.id}`} className="block">
                        <Button
                            className="w-full h-9 font-mono text-sm font-medium group/btn"
                            variant="outline"
                        >
                            Predict
                            <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

export function MarketCardSkeleton() {
    return (
        <div className="flex flex-col h-full rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="h-px w-full bg-border" />
            <div className="px-5 pt-5 pb-4 space-y-3 flex-1">
                <div className="flex items-center justify-between">
                    <div className="h-5 w-16 bg-muted animate-pulse rounded-md" />
                    <div className="h-4 w-10 bg-muted animate-pulse rounded-md" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-4/5 bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2.5">
                        <div className="h-3 w-6 bg-muted animate-pulse rounded" />
                        <div className="flex-1 h-1.5 bg-muted animate-pulse rounded-full" />
                        <div className="h-3 w-9 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="h-3 w-6 bg-muted animate-pulse rounded" />
                        <div className="flex-1 h-1.5 bg-muted animate-pulse rounded-full" />
                        <div className="h-3 w-9 bg-muted animate-pulse rounded" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
            <div className="px-5 pb-5">
                <div className="h-3 w-full bg-muted animate-pulse rounded mb-3" />
                <div className="h-9 w-full bg-muted animate-pulse rounded-lg" />
            </div>
        </div>
    );
}
