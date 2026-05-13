'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { blockToDate, formatResolutionDate } from '@/lib/date-utils';
import { motion } from 'framer-motion';

interface MarketCardProps {
    market: any;
    index?: number;
}

export function MarketCard({ market, index = 0 }: MarketCardProps) {
    const question = market.question || 'Unknown Market';
    const category = market.category || 'General';
    const isActive = market.status === 'active';

    const yesPool = Number(market['yes-pool']) / 1_000_000;
    const noPool = Number(market['no-pool']) / 1_000_000;
    const totalPool = yesPool + noPool;

    const yesMultiplier = yesPool > 0 ? (totalPool / yesPool).toFixed(2) : '2.00';
    const noMultiplier  = noPool  > 0 ? (totalPool / noPool).toFixed(2)  : '2.00';

    const yesPercent = totalPool > 0 ? (yesPool / totalPool) * 100 : 50;
    const noPercent  = totalPool > 0 ? (noPool  / totalPool) * 100 : 50;

    const resolveBlock = market['resolve-date'] || 0;
    const resolutionDate = resolveBlock > 0 ? blockToDate(resolveBlock) : null;
    const timeDisplay = resolutionDate ? formatResolutionDate(resolutionDate) : 'Active';

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
            <div className="group relative flex flex-col h-full rounded-xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">

                {/* Top accent line — animates to primary on hover */}
                <div className="h-px w-full bg-border group-hover:bg-primary/60 transition-colors duration-300" />

                {/* Header */}
                <div className="px-5 pt-5 pb-4 space-y-3 flex-1">

                    {/* Category + live indicator */}
                    <div className="flex items-center justify-between">
                        <Badge
                            variant="outline"
                            className="text-[11px] font-mono tracking-wide border-border/80 text-muted-foreground px-2 py-0.5"
                        >
                            {category}
                        </Badge>

                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            {isActive ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                    </span>
                                    <span className="text-[11px] font-mono text-green-500">LIVE</span>
                                </>
                            ) : (
                                <span className="text-[11px] font-mono uppercase">{market.status}</span>
                            )}
                        </div>
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
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeDisplay}
                        </span>
                        <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {market.totalBets ?? 0} bets
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
