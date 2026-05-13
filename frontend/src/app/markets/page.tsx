'use client';

import { Navbar } from "@/components/navbar";
import { MarketsList } from "@/components/markets-list";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";
import { fadeInUp, defaultTransition } from "@/lib/animations";
import { BarChart3, Globe, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlatformStats } from "@/lib/stacks-api";

export default function MarketsPage() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        getPlatformStats().then(setStats);
    }, []);

    const totalMarkets  = stats?.['total-markets']  ?? '--';
    const activeMarkets = stats?.['active-markets'] ?? '--';
    const totalVolume   = stats ? (Number(stats['total-volume']) / 1_000_000) : null;

    const volumeDisplay = totalVolume === null
        ? '--'
        : totalVolume >= 1000
            ? `${(totalVolume / 1000).toFixed(1)}k`
            : totalVolume.toFixed(0);

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />

            {/* Page header */}
            <div className="relative border-b border-border/60 bg-muted/20 overflow-hidden">
                {/* Dot-grid background */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />

                <div className="container relative py-10 md:py-14">
                    <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                        className="space-y-1 mb-8"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Globe className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[11px] font-mono tracking-widest text-primary uppercase">
                                Prediction Markets
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Explore Markets
                        </h1>
                        <p className="text-muted-foreground max-w-xl">
                            Browse all prediction markets. Place your bets on outcomes you believe in.
                        </p>
                    </motion.div>

                    {/* Stats strip */}
                    <motion.div
                        className="flex flex-wrap gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...defaultTransition, delay: 0.15 }}
                    >
                        {[
                            { icon: BarChart3, label: 'Total Markets', value: String(totalMarkets) },
                            { icon: Zap,       label: 'Active Now',    value: String(activeMarkets), accent: true },
                            { icon: Globe,     label: 'Total Volume',  value: `$${volumeDisplay} STX` },
                        ].map(({ icon: Icon, label, value, accent }) => (
                            <div
                                key={label}
                                className="flex items-center gap-3 border border-border/60 rounded-lg px-4 py-2.5 bg-card/60 backdrop-blur"
                            >
                                <Icon className={`h-3.5 w-3.5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div>
                                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                                        {label}
                                    </div>
                                    <div className={`text-sm font-bold font-mono ${accent ? 'text-primary' : ''}`}>
                                        {value}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            <section className="container py-10 flex-1">
                <MarketsList />
            </section>

            <Footer />
        </main>
    );
}
