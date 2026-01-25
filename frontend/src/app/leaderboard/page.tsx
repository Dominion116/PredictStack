'use client';

import { useState, useEffect } from 'react';
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Trophy, Medal, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Footer } from "@/components/footer";

interface LeaderboardEntry {
    address: string;
    totalProfit: number;
    winRate: number;
    totalBets: number;
    rank: number;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { address: "ST1NX...48VQ", totalProfit: 12450.50, winRate: 72.5, totalBets: 142, rank: 1 },
    { address: "ST2PH...89KL", totalProfit: 8940.20, winRate: 68.2, totalBets: 98, rank: 2 },
    { address: "ST3MJ...12XY", totalProfit: 6720.00, winRate: 64.1, totalBets: 85, rank: 3 },
    { address: "ST1GR...56ZA", totalProfit: 4500.75, winRate: 59.5, totalBets: 112, rank: 4 },
    { address: "ST2RV...33NM", totalProfit: 3200.00, winRate: 55.8, totalBets: 64, rank: 5 },
    { address: "ST1WL...99PQ", totalProfit: 2150.25, winRate: 52.3, totalBets: 45, rank: 6 },
    { address: "ST3KK...77BT", totalProfit: 1840.10, winRate: 51.9, totalBets: 38, rank: 7 },
    { address: "ST1DF...22GG", totalProfit: 1560.50, winRate: 50.5, totalBets: 52, rank: 8 },
    { address: "ST2HH...11JJ", totalProfit: 1200.00, winRate: 49.8, totalBets: 31, rank: 9 },
    { address: "ST3SS...44KK", totalProfit: 980.20, winRate: 48.2, totalBets: 27, rank: 10 },
    { address: "ST4AA...55LL", totalProfit: 850.00, winRate: 47.5, totalBets: 22, rank: 11 },
    { address: "ST5BB...66MM", totalProfit: 720.30, winRate: 46.8, totalBets: 19, rank: 12 },
    { address: "ST6CC...77NN", totalProfit: 650.00, winRate: 45.2, totalBets: 18, rank: 13 },
    { address: "ST7DD...88OO", totalProfit: 580.50, winRate: 44.1, totalBets: 15, rank: 14 },
    { address: "ST8EE...99PP", totalProfit: 490.00, winRate: 43.0, totalBets: 12, rank: 15 }
];

const ITEMS_PER_PAGE = 10;

export default function LeaderboardPage() {
    const [mounted, setMounted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const totalPages = Math.ceil(MOCK_LEADERBOARD.length / ITEMS_PER_PAGE);
    const paginatedData = MOCK_LEADERBOARD.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
        if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
        return <span className="text-muted-foreground font-mono">{rank}</span>;
    };

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            
            <section className="container py-12 flex-1">
                <div className="space-y-2 mb-10">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Leaderboard</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Top predictors ranked by total profit. Updated after each market resolution.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Top Earner</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{MOCK_LEADERBOARD[0].address}</div>
                            <p className="text-sm text-green-500 font-medium">+${MOCK_LEADERBOARD[0].totalProfit.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Highest Win Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{MOCK_LEADERBOARD[0].winRate}%</div>
                            <p className="text-sm text-muted-foreground">{MOCK_LEADERBOARD[0].address}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Predictors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{MOCK_LEADERBOARD.length}</div>
                            <p className="text-sm text-muted-foreground">Active this month</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Leaderboard Table */}
                <Card>
                    <CardContent className="p-0">
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
                                                <span className="font-semibold text-green-500">
                                                    +${entry.totalProfit.toLocaleString()}
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
                    </CardContent>
                </Card>

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
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                    Minimum 5 bets required to appear on the leaderboard.
                </p>
            </section>
            <Footer />
        </main>
    );
}
