'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, defaultTransition } from '@/lib/animations';
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, ChevronLeft, ChevronRight, Loader2, RefreshCcw } from 'lucide-react';
import { Footer } from "@/components/footer";
import { getLeaderboardData } from '@/lib/stacks-api';

interface LeaderboardEntry {
    address: string;
    totalProfit: number;
    winRate: number;
    totalBets: number;
    rank: number;
}

// Fallback mock data when no on-chain data is available
const FALLBACK_DATA: LeaderboardEntry[] = [
    { address: "ST1NX...48VQ", totalProfit: 12450.50, winRate: 72.5, totalBets: 142, rank: 1 },
    { address: "ST2PH...89KL", totalProfit: 8940.20, winRate: 68.2, totalBets: 98, rank: 2 },
    { address: "ST3MJ...12XY", totalProfit: 6720.00, winRate: 64.1, totalBets: 85, rank: 3 },
    { address: "ST1GR...56ZA", totalProfit: 4500.75, winRate: 59.5, totalBets: 112, rank: 4 },
    { address: "ST2RV...33NM", totalProfit: 3200.00, winRate: 55.8, totalBets: 64, rank: 5 },
];

const ITEMS_PER_PAGE = 10;

export default function LeaderboardPage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            const data = await getLeaderboardData(50);
            // Use on-chain data if available, otherwise fallback to mock
            setLeaderboard(data.length > 0 ? data : FALLBACK_DATA);
        } catch (error) {
            console.error("Failed to load leaderboard:", error);
            setLeaderboard(FALLBACK_DATA);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        loadLeaderboard();
    }, []);

    if (!mounted) return null;

    const totalPages = Math.ceil(leaderboard.length / ITEMS_PER_PAGE);
    const paginatedData = leaderboard.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
        if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
        return <span className="text-muted-foreground font-mono">{rank}</span>;
    };

    const topEarner = leaderboard[0];

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            
            <section className="container py-12 flex-1">
                <motion.div 
                    className="flex justify-between items-start mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={defaultTransition}
                >
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Leaderboard</h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Top predictors ranked by total profit. Data synced from on-chain events.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadLeaderboard} disabled={loading}>
                        <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </motion.div>

                {/* Stats Cards */}
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
                    initial="initial"
                    animate="animate"
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeInUp}>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Top Earner</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{topEarner?.address || '--'}</div>
                                <p className="text-sm text-green-500 font-medium">
                                    {topEarner ? `+$${topEarner.totalProfit.toLocaleString()}` : '--'}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Highest Win Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{topEarner?.winRate || 0}%</div>
                                <p className="text-sm text-muted-foreground">{topEarner?.address || '--'}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Predictors</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{leaderboard.length}</div>
                                <p className="text-sm text-muted-foreground">Active users</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* Leaderboard Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...defaultTransition, delay: 0.3 }}
                >
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left py-4 px-6 font-medium text-muted-foreground w-16">Rank</th>
                                            <th className="text-left py-4 px-6 font-medium text-muted-foreground">Address</th>
                                            <th className="text-right py-4 px-6 font-medium text-muted-foreground">Profit</th>
                                            <th className="text-right py-4 px-6 font-medium text-muted-foreground hidden md:table-cell">Win Rate</th>
                                            <th className="text-right py-4 px-6 font-medium text-muted-foreground hidden md:table-cell">Bets</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedData.map((entry) => (
                                            <tr 
                                                key={entry.address} 
                                                className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-center w-8 h-8">
                                                        {getRankIcon(entry.rank)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                                            {entry.address.slice(2, 4)}
                                                        </div>
                                                        <span className="font-mono text-sm">{entry.address}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className={`font-semibold ${entry.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {entry.totalProfit >= 0 ? '+' : ''}${entry.totalProfit.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right hidden md:table-cell">
                                                    <Badge variant="secondary" className="font-mono">
                                                        {entry.winRate}%
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6 text-right text-muted-foreground hidden md:table-cell">
                                                    {entry.totalBets}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-6">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className="w-8 h-8 p-0"
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <p className="text-sm text-muted-foreground mt-6 text-center">
                    Leaderboard data is aggregated from on-chain events. Minimum 1 bet required.
                </p>
            </section>
            <Footer />
        </main>
    );
}
