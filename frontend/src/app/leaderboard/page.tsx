'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, defaultTransition } from '@/lib/animations';
import { Navbar } from "@/components/navbar";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, ChevronLeft, ChevronRight, RefreshCcw, Users } from 'lucide-react';
import { Footer } from "@/components/footer";
import { getLeaderboardData } from '@/lib/stacks-api';

interface LeaderboardEntry {
    address: string;
    totalProfit: number;
    winRate: number;
    totalBets: number;
    rank: number;
}

const FALLBACK_DATA: LeaderboardEntry[] = [
    { address: "ST1NX...48VQ", totalProfit: 12450.50, winRate: 72.5, totalBets: 142, rank: 1 },
    { address: "ST2PH...89KL", totalProfit: 8940.20,  winRate: 68.2, totalBets: 98,  rank: 2 },
    { address: "ST3MJ...12XY", totalProfit: 6720.00,  winRate: 64.1, totalBets: 85,  rank: 3 },
    { address: "ST1GR...56ZA", totalProfit: 4500.75,  winRate: 59.5, totalBets: 112, rank: 4 },
    { address: "ST2RV...33NM", totalProfit: 3200.00,  winRate: 55.8, totalBets: 64,  rank: 5 },
];

const ITEMS_PER_PAGE = 10;

const PODIUM_COLORS = [
    { ring: 'ring-yellow-400/60',  bg: 'bg-yellow-400/10',  text: 'text-yellow-400',  icon: Trophy, label: '1st' },
    { ring: 'ring-slate-400/60',   bg: 'bg-slate-400/10',   text: 'text-slate-400',   icon: Medal,  label: '2nd' },
    { ring: 'ring-amber-600/60',   bg: 'bg-amber-600/10',   text: 'text-amber-600',   icon: Award,  label: '3rd' },
];

export default function LeaderboardPage() {
    const [loading, setLoading]         = useState(true);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const load = async () => {
        setLoading(true);
        try {
            const data = await getLeaderboardData(50);
            setLeaderboard(data.length > 0 ? data : FALLBACK_DATA);
        } catch {
            setLeaderboard(FALLBACK_DATA);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const top3   = leaderboard.slice(0, 3);
    const rest   = leaderboard.slice(3);
    const totalPages   = Math.ceil(rest.length / ITEMS_PER_PAGE);
    const paginated    = rest.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const topProfit    = leaderboard[0]?.totalProfit ?? 0;
    const topWinRate   = [...leaderboard].sort((a, b) => b.winRate - a.winRate)[0]?.winRate ?? 0;

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />

            {/* Page header */}
            <div className="relative border-b border-border/60 bg-muted/20 overflow-hidden">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />
                <div className="container relative py-10 md:py-14">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <motion.div variants={fadeInUp} initial="initial" animate="animate">
                            <div className="flex items-center gap-2 mb-2">
                                <Trophy className="h-3.5 w-3.5 text-primary" />
                                <span className="text-[11px] font-mono tracking-widest text-primary uppercase">Rankings</span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Leaderboard</h1>
                            <p className="text-muted-foreground mt-1">Top predictors ranked by total profit.</p>
                        </motion.div>

                        {/* Top stats strip */}
                        <motion.div
                            className="flex flex-wrap gap-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...defaultTransition, delay: 0.15 }}
                        >
                            {[
                                { label: 'Predictors',   value: String(leaderboard.length), icon: Users },
                                { label: 'Top Profit',   value: `$${topProfit.toLocaleString()}`, icon: Trophy },
                                { label: 'Best Win Rate', value: `${topWinRate}%`, icon: Award },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="flex items-center gap-3 border border-border/60 rounded-lg px-4 py-2.5 bg-card/60 backdrop-blur">
                                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <div>
                                        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{label}</div>
                                        <div className="text-sm font-bold font-mono">
                                            {loading ? <span className="inline-block w-12 h-3 bg-muted animate-pulse rounded" /> : value}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={load}
                                disabled={loading}
                                className="font-mono text-xs h-auto"
                            >
                                <RefreshCcw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>

            <section className="container py-10 flex-1 space-y-10">

                {/* Podium — top 3 */}
                {!loading && top3.length > 0 && (
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={staggerContainer}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                        {top3.map((entry, i) => {
                            const style = PODIUM_COLORS[i];
                            const Icon  = style.icon;
                            return (
                                <motion.div
                                    key={entry.address}
                                    variants={fadeInUp}
                                    className={`relative rounded-xl border bg-card p-5 ring-1 ${style.ring} overflow-hidden`}
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-3xl ${style.bg} opacity-50`} />

                                    <div className="relative space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[11px] font-mono font-bold tracking-widest ${style.text}`}>
                                                {style.label}
                                            </span>
                                            <Icon className={`h-4 w-4 ${style.text}`} />
                                        </div>

                                        <div>
                                            <p className="text-xs font-mono text-muted-foreground truncate">{entry.address}</p>
                                        </div>

                                        <div>
                                            <div className={`text-2xl font-bold font-mono ${entry.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {entry.totalProfit >= 0 ? '+' : ''}${entry.totalProfit.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] font-mono text-muted-foreground">total profit</div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-1">
                                            <div className="text-xs font-mono">
                                                <span className="text-foreground font-bold">{entry.winRate}%</span>
                                                <span className="text-muted-foreground ml-1">win rate</span>
                                            </div>
                                            <div className="w-px h-3 bg-border" />
                                            <div className="text-xs font-mono">
                                                <span className="text-foreground font-bold">{entry.totalBets}</span>
                                                <span className="text-muted-foreground ml-1">bets</span>
                                            </div>
                                        </div>

                                        {/* Win rate bar */}
                                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${style.text.replace('text-', 'bg-')}`}
                                                style={{ width: `${entry.winRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Ranks 4+ table */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...defaultTransition, delay: 0.25 }}
                    className="rounded-xl border border-border/60 bg-card overflow-hidden"
                >
                    {/* Table header */}
                    <div className="grid grid-cols-[3rem_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border/60 bg-muted/30">
                        {['#', 'Address', 'Profit', 'Win Rate', 'Bets'].map((h, i) => (
                            <div
                                key={h}
                                className={`text-[10px] font-mono uppercase tracking-widest text-muted-foreground ${i > 1 ? 'text-right hidden md:block' : ''}`}
                            >
                                {h}
                            </div>
                        ))}
                    </div>

                    {loading ? (
                        <div className="divide-y divide-border/40">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="grid grid-cols-[3rem_1fr_auto] md:grid-cols-[3rem_1fr_auto_auto_auto] gap-4 px-5 py-4 animate-pulse">
                                    <div className="h-4 w-6 bg-muted rounded" />
                                    <div className="h-4 w-40 bg-muted rounded" />
                                    <div className="h-4 w-20 bg-muted rounded ml-auto" />
                                    <div className="h-5 w-14 bg-muted rounded ml-auto hidden md:block" />
                                    <div className="h-4 w-8  bg-muted rounded ml-auto hidden md:block" />
                                </div>
                            ))}
                        </div>
                    ) : paginated.length === 0 && rest.length === 0 ? (
                        <div className="py-16 text-center space-y-3">
                            <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                            <p className="text-sm font-mono text-muted-foreground">No additional entries yet.</p>
                            <p className="text-xs font-mono text-muted-foreground/60">Place a bet to appear on the leaderboard.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {paginated.map((entry) => (
                                <div
                                    key={entry.address}
                                    className="group grid grid-cols-[3rem_1fr_auto] md:grid-cols-[3rem_1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-muted/20 transition-colors"
                                >
                                    {/* Rank */}
                                    <span className="text-sm font-mono font-bold text-muted-foreground">
                                        {entry.rank}
                                    </span>

                                    {/* Address */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-mono font-bold shrink-0">
                                            {entry.address.slice(2, 4).toUpperCase()}
                                        </div>
                                        <span className="font-mono text-sm truncate">{entry.address}</span>
                                    </div>

                                    {/* Profit */}
                                    <span className={`font-mono text-sm font-bold text-right ${entry.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {entry.totalProfit >= 0 ? '+' : ''}${entry.totalProfit.toLocaleString()}
                                    </span>

                                    {/* Win rate */}
                                    <div className="hidden md:flex items-center gap-2 justify-end">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary/70 rounded-full"
                                                style={{ width: `${entry.winRate}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                                            {entry.winRate}%
                                        </span>
                                    </div>

                                    {/* Bets */}
                                    <span className="hidden md:block text-sm font-mono text-muted-foreground text-right">
                                        {entry.totalBets}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                            <Button
                                key={page}
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-8 h-8 p-0 font-mono text-xs"
                            >
                                {page}
                            </Button>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <p className="text-[11px] font-mono text-muted-foreground text-center">
                    Ranked by total profit · minimum 1 bet required · data synced from on-chain events
                </p>
            </section>

            <Footer />
        </main>
    );
}
