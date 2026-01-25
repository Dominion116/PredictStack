
'use client';

import { useState, useEffect } from 'react';
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, TrendingUp, Wallet, ArrowUpRight } from 'lucide-react';
import { Footer } from "@/components/footer";

interface LeaderboardEntry {
    address: string;
    totalProfit: number;
    winRate: number;
    totalBets: number;
    rank: number;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    {
        address: "ST1NX...48VQ",
        totalProfit: 12450.50,
        winRate: 72.5,
        totalBets: 142,
        rank: 1
    },
    {
        address: "ST2PH...89KL",
        totalProfit: 8940.20,
        winRate: 68.2,
        totalBets: 98,
        rank: 2
    },
    {
        address: "ST3MJ...12XY",
        totalProfit: 6720.00,
        winRate: 64.1,
        totalBets: 85,
        rank: 3
    },
    {
        address: "ST1GR...56ZA",
        totalProfit: 4500.75,
        winRate: 59.5,
        totalBets: 112,
        rank: 4
    },
    {
        address: "ST2RV...33NM",
        totalProfit: 3200.00,
        winRate: 55.8,
        totalBets: 64,
        rank: 5
    },
    {
        address: "ST1WL...99PQ",
        totalProfit: 2150.25,
        winRate: 52.3,
        totalBets: 45,
        rank: 6
    },
    {
        address: "ST3KK...77BT",
        totalProfit: 1840.10,
        winRate: 51.9,
        totalBets: 38,
        rank: 7
    },
    {
        address: "ST1DF...22GG",
        totalProfit: 1560.50,
        winRate: 50.5,
        totalBets: 52,
        rank: 8
    },
    {
        address: "ST2HH...11JJ",
        totalProfit: 1200.00,
        winRate: 49.8,
        totalBets: 31,
        rank: 9
    },
    {
        address: "ST3SS...44KK",
        totalProfit: 980.20,
        winRate: 48.2,
        totalBets: 27,
        rank: 10
    }
];

export default function LeaderboardPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            
            <div className="container py-12 md:py-20 flex-1 flex flex-col items-center">
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium mb-2">
                        🏆 Hall of Fame
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter sm:text-5xl mb-6">
                        PredictStack <span className="text-orange-500">Leaders</span>
                    </h1>
                    <p className="max-w-[700px] text-muted-foreground md:text-xl mx-auto leading-relaxed">
                        The top predictors on PredictStack. Ranked by total profit in USDCx.
                    </p>
                </div>

                {/* Top 3 Podium */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-16">
                    {/* Rank 2 */}
                    <PodiumCard entry={MOCK_LEADERBOARD[1]} delay="100" />
                    {/* Rank 1 */}
                    <div className="md:-mt-8">
                        <PodiumCard entry={MOCK_LEADERBOARD[0]} delay="0" highlight />
                    </div>
                    {/* Rank 3 */}
                    <PodiumCard entry={MOCK_LEADERBOARD[2]} delay="200" />
                </div>

                {/* Main Leaderboard Table */}
                <div className="w-full max-w-4xl space-y-4">
                    <div className="grid grid-cols-12 px-6 text-sm font-medium text-muted-foreground uppercase tracking-wider h-10 items-center border-b">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-4 text-left">Predictor</div>
                        <div className="col-span-3 text-right">Profit</div>
                        <div className="col-span-2 text-right">Win Rate</div>
                        <div className="col-span-2 text-right">Bets</div>
                    </div>
                    
                    {MOCK_LEADERBOARD.slice(3).map((entry, index) => (
                        <div 
                            key={entry.address}
                            className="grid grid-cols-12 px-6 py-4 bg-card/50 hover:bg-card border rounded-xl items-center transition-all hover:shadow-md group"
                        >
                            <div className="col-span-1 text-center font-bold text-muted-foreground">
                                {entry.rank}
                            </div>
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground shadow-inner border border-muted group-hover:scale-110 transition-transform">
                                    {entry.address.slice(2, 4)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-foreground">{entry.address}</span>
                                    <span className="text-xs text-muted-foreground flex items-center">
                                        <Wallet className="h-3 w-3 mr-1" />
                                        Verified Predictor
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-3 text-right font-bold text-green-500">
                                +${entry.totalProfit.toLocaleString()}
                            </div>
                            <div className="col-span-2 text-right font-medium">
                                <Badge variant="outline" className="font-mono text-orange-500 border-orange-200">
                                    {entry.winRate}%
                                </Badge>
                            </div>
                            <div className="col-span-2 text-right text-muted-foreground font-medium">
                                {entry.totalBets}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-12 text-center text-muted-foreground max-w-md">
                    <p className="text-sm">
                        Leaderboard updates every 10 minutes based on resolved market payouts.
                        Only users with more than 5 bets are eligible.
                    </p>
                </div>
            </div>
            <Footer />
        </main>
    );
}

function PodiumCard({ entry, highlight, delay }: { entry: LeaderboardEntry, highlight?: boolean, delay?: string }) {
    return (
        <Card className={`relative overflow-hidden transition-all hover:translate-y-[-8px] hover:shadow-2xl duration-500 animate-in fade-in slide-in-from-bottom-8 ${highlight ? 'border-orange-500 ring-4 ring-orange-500/10 bg-orange-500/[0.02] scale-105 z-10 shadow-xl' : 'bg-card/30'}`} style={{ animationDelay: `${delay}ms` }}>
            {highlight && (
                <div className="absolute top-0 right-0 p-3">
                    <Crown className="h-8 w-8 text-orange-500 fill-orange-500 animate-pulse" />
                </div>
            )}
            <CardHeader className="text-center pb-2 pt-8">
                <div className="relative mx-auto mb-4">
                    <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-black border-4 shadow-xl ${highlight ? 'bg-orange-500 text-white border-orange-200' : 'bg-secondary text-secondary-foreground border-border'}`}>
                        {entry.address.slice(2, 4)}
                    </div>
                    <div className={`absolute -bottom-2 -right-2 h-10 w-10 rounded-full border-4 flex items-center justify-center font-black shadow-lg ${entry.rank === 1 ? 'bg-yellow-500 border-yellow-700 text-white' : entry.rank === 2 ? 'bg-slate-300 border-slate-400 text-slate-700' : 'bg-orange-600 border-orange-800 text-white'}`}>
                        {entry.rank}
                    </div>
                </div>
                <CardTitle className="text-xl font-bold truncate">{entry.address}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1 font-medium">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    Top Performer
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8 pt-4">
                <div className="text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">Total Profit</div>
                    <div className="text-3xl font-black text-green-500">
                        +${entry.totalProfit.toLocaleString()}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div className="text-center">
                        <div className="text-[10px] text-muted-foreground uppercase">Win Rate</div>
                        <div className="font-bold text-orange-500">{entry.winRate}%</div>
                    </div>
                    <div className="text-center border-l">
                        <div className="text-[10px] text-muted-foreground uppercase">Bets</div>
                        <div className="font-bold text-foreground">{entry.totalBets}</div>
                    </div>
                </div>
            </CardContent>
            {highlight && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
            )}
        </Card>
    );
}
