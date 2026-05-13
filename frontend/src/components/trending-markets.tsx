'use client';

import { useEffect, useState } from 'react';
import { getRecentMarkets } from '@/api/markets';
import { MarketCard, MarketCardSkeleton } from './market-card';
import { Button } from './ui/button';
import { ArrowRight, RefreshCcw, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeInUp, defaultTransition } from '@/lib/animations';

const TRENDING_LIMIT = 6;

export function TrendingMarkets() {
    const [markets, setMarkets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await getRecentMarkets(TRENDING_LIMIT);
            setMarkets(data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const activeCount = markets.filter(m => m.status === 'active').length;
    const totalVolume = markets.reduce((sum, m) => {
        const yes = Number(m['yes-pool']) / 1_000_000;
        const no  = Number(m['no-pool'])  / 1_000_000;
        return sum + yes + no;
    }, 0);

    return (
        <section className="relative">
            {/* Subtle background grid */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="container relative py-16 md:py-24">

                {/* Section header */}
                <motion.div
                    className="mb-12"
                    variants={fadeInUp}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                >
                    {/* Label row */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                        <span className="text-[11px] font-mono tracking-widest text-primary uppercase">
                            Live Markets
                        </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Trending Markets
                            </h2>
                            <p className="mt-2 text-muted-foreground">
                                The most active predictions on PredictStack right now.
                            </p>
                        </div>

                        {/* Live stats + CTA */}
                        <div className="flex flex-wrap items-center gap-3 md:shrink-0">
                            {!loading && !error && (
                                <div className="flex items-center gap-4 text-[12px] font-mono text-muted-foreground border border-border/60 rounded-lg px-4 py-2 bg-muted/30">
                                    <span>
                                        <span className="text-green-500 font-semibold">{activeCount}</span> active
                                    </span>
                                    <span className="w-px h-3 bg-border" />
                                    <span>
                                        <span className="text-foreground font-semibold">
                                            ${totalVolume >= 1000
                                                ? `${(totalVolume / 1000).toFixed(1)}k`
                                                : totalVolume.toFixed(0)}
                                        </span>{' '}
                                        vol
                                    </span>
                                </div>
                            )}
                            <Button asChild variant="outline" className="font-mono text-sm h-9">
                                <Link href="/markets">
                                    All markets <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Cards */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: TRENDING_LIMIT }).map((_, i) => (
                            <MarketCardSkeleton key={i} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="border border-dashed border-border rounded-xl py-16 text-center space-y-4">
                        <p className="text-muted-foreground font-mono text-sm">
                            Failed to load markets.
                        </p>
                        <Button variant="outline" size="sm" onClick={load} className="font-mono">
                            <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Retry
                        </Button>
                    </div>
                ) : markets.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl py-16 text-center">
                        <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground font-mono text-sm">
                            No markets yet — check back soon.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {markets.map((market, index) => (
                                <MarketCard key={market.id} market={market} index={index} />
                            ))}
                        </div>

                        <motion.div
                            className="mt-10 text-center"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ ...defaultTransition, delay: 0.4 }}
                        >
                            <Button asChild variant="outline" size="lg" className="font-mono">
                                <Link href="/markets">
                                    Browse all markets
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </motion.div>
                    </>
                )}
            </div>
        </section>
    );
}
