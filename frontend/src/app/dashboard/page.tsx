'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, defaultTransition } from '@/lib/animations';
import { Navbar } from "@/components/navbar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2, Wallet, TrendingUp, RefreshCcw,
    CheckCircle, ArrowRight, Clock, CircleDot,
    BarChart2, Trophy, AlertCircle,
} from 'lucide-react';
import { userSession, getContractConfig, isUserSignedIn, getUserAddress, NETWORK_ENV } from '@/lib/constants';
import { confirmClaim, getStxBalance, getUserDashboard } from '@/lib/stacks-api';
import { blockToDate } from '@/lib/date-utils';
import { useConnect } from '@stacks/connect-react';
// @stacks/transactions loaded dynamically inside handleClaim to keep it out of the main bundle
import { toast } from 'sonner';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { RecentActivity } from '@/components/recent-activity';

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return <DashboardContent />;
}

function StatCard({
    label, value, sub, icon: Icon, accent = false,
}: {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; accent?: boolean;
}) {
    return (
        <motion.div variants={fadeInUp}>
            <div className="relative rounded-xl border border-border/60 bg-card p-5 overflow-hidden group hover:border-primary/30 transition-colors duration-300">
                <div className="flex items-start justify-between mb-3">
                    <span className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
                        {label}
                    </span>
                    <Icon className={`h-4 w-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className={`text-2xl font-bold font-mono ${accent ? 'text-primary' : ''}`}>
                    {value}
                </div>
                {sub && (
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                )}
                {/* Subtle corner accent */}
                <div className="absolute bottom-0 right-0 w-16 h-16 rounded-tl-3xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
        </motion.div>
    );
}

function DashboardContent() {
    const [loading, setLoading]       = useState(true);
    const [userData, setUserData]     = useState<any>(null);
    const [balance, setBalance]       = useState<number>(0);
    const [userBets, setUserBets]     = useState<any[]>([]);
    const [isClaiming, setIsClaiming] = useState<number | null>(null);
    const [summary, setSummary]       = useState<any>(null);

    const { doContractCall } = useConnect();

    useEffect(() => {
        if (isUserSignedIn()) {
            setUserData(userSession.loadUserData());
            loadDashboardData();
        } else {
            setLoading(false);
        }
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const address = getUserAddress();
            const [bal, dashboard] = await Promise.all([
                getStxBalance(address),
                getUserDashboard(address),
            ]);
            setBalance(bal);
            setSummary(dashboard.summary);
            const bets = dashboard.positions.map(item => ({
                ...item.market,
                position: {
                    'yes-amount': item.position.yesAmountMicro,
                    'no-amount':  item.position.noAmountMicro,
                    'total-wagered': item.position.totalWageredMicro,
                    claimed: item.position.claimed,
                },
                id: item.market.contractMarketId,
            }));
            setUserBets(bets.reverse());
        } catch (error) {
            console.error(error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (marketId: number) => {
        setIsClaiming(marketId);
        const config = getContractConfig();
        try {
            const [tx, net] = await Promise.all([
                import('@stacks/transactions'),
                import('@stacks/network'),
            ]);
            const { uintCV, PostConditionMode, AnchorMode } = tx;
            const network = NETWORK_ENV === 'mainnet' ? net.STACKS_MAINNET : net.STACKS_TESTNET;
            const userAddress = getUserAddress();
            await doContractCall({
                network,
                contractAddress: config.deployer,
                contractName: config.predictionMarket,
                functionName: 'claim-winnings',
                functionArgs: [uintCV(marketId)],
                postConditionMode: PostConditionMode.Allow,
                anchorMode: AnchorMode.Any,
                onFinish: async (data) => {
                    await confirmClaim({ userAddress, contractMarketId: marketId, txId: data.txId, type: 'winnings' });
                    toast.success("Winnings claimed!");
                    setTimeout(() => { loadDashboardData(); setIsClaiming(null); }, 4000);
                },
                onCancel: () => setIsClaiming(null),
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to claim");
            setIsClaiming(null);
        }
    };

    if (!isUserSignedIn()) {
        return (
            <main className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center space-y-4 max-w-sm">
                        <div className="h-16 w-16 rounded-2xl border border-border bg-muted/40 flex items-center justify-center mx-auto">
                            <Wallet className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h1 className="text-2xl font-bold">Connect Wallet</h1>
                        <p className="text-muted-foreground text-sm">
                            Connect your Stacks wallet to view your prediction portfolio.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    const activeBets   = userBets.filter(b => b.status === 'active');
    const resolvedBets = userBets.filter(b => b.status !== 'active');
    const totalInvested = userBets.reduce((acc, bet) => {
        return acc + ((Number(bet.position['yes-amount']) + Number(bet.position['no-amount'])) / 1_000_000);
    }, 0);
    const winRate = summary?.winCount > 0
        ? ((summary.winCount / (summary.winCount + summary.lossCount)) * 100).toFixed(0)
        : '—';

    const addr = isUserSignedIn() ? getUserAddress() : '';
    const shortAddress = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

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
                <div className="container relative py-8 md:py-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={defaultTransition}>
                            <div className="flex items-center gap-2 mb-2">
                                <CircleDot className="h-3 w-3 text-primary" />
                                <span className="text-[11px] font-mono tracking-widest text-primary uppercase">Portfolio</span>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                            {shortAddress && (
                                <p className="text-xs font-mono text-muted-foreground mt-1">{shortAddress}</p>
                            )}
                        </motion.div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadDashboardData}
                            disabled={loading}
                            className="font-mono text-xs self-start md:self-auto"
                        >
                            <RefreshCcw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container py-8 space-y-8 flex-1">

                {/* Stats */}
                <motion.div
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                    initial="initial"
                    animate="animate"
                    variants={staggerContainer}
                >
                    <StatCard label="STX Balance"      value={`${balance.toLocaleString()} STX`} sub="Available to bet"            icon={Wallet}    accent />
                    <StatCard label="Active"           value={activeBets.length}                  sub={`of ${userBets.length} total`} icon={TrendingUp} />
                    <StatCard label="Total Invested"   value={`${totalInvested.toFixed(2)} STX`}  sub="Lifetime volume"             icon={BarChart2} />
                    <StatCard label="Win Rate"         value={winRate === '—' ? '—' : `${winRate}%`} sub={`${summary?.winCount ?? 0}W / ${summary?.lossCount ?? 0}L`} icon={Trophy} />
                </motion.div>

                {/* Main content */}
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...defaultTransition, delay: 0.2 }}
                >
                    {/* Bets (2/3 width) */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="active">
                            <TabsList className="font-mono text-xs">
                                <TabsTrigger value="active">
                                    Active
                                    <span className="ml-2 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                        {activeBets.length}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger value="history">
                                    History
                                    <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                                        {resolvedBets.length}
                                    </span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="active" className="mt-5">
                                {loading ? (
                                    <LoadingRows />
                                ) : activeBets.length > 0 ? (
                                    <div className="space-y-3">
                                        {activeBets.map(bet => (
                                            <BetRow key={bet.id} bet={bet} onClaim={handleClaim} isClaiming={isClaiming === bet.id} />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyBets text="No active predictions." action />
                                )}
                            </TabsContent>

                            <TabsContent value="history" className="mt-5">
                                {loading ? (
                                    <LoadingRows />
                                ) : resolvedBets.length > 0 ? (
                                    <div className="space-y-3">
                                        {resolvedBets.map(bet => (
                                            <BetRow key={bet.id} bet={bet} onClaim={handleClaim} isClaiming={isClaiming === bet.id} />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyBets text="No resolved markets yet." />
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <RecentActivity />
                    </div>
                </motion.div>
            </div>

            <Footer />
        </main>
    );
}

function LoadingRows() {
    return (
        <div className="space-y-3">
            {[0, 1, 2].map(i => (
                <div key={i} className="rounded-xl border border-border/60 bg-card p-5 animate-pulse">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-16 rounded bg-muted" />
                            <div className="h-4 w-3/4 rounded bg-muted" />
                            <div className="h-3 w-1/2 rounded bg-muted" />
                        </div>
                        <div className="h-8 w-24 rounded-lg bg-muted shrink-0" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyBets({ text, action }: { text: string; action?: boolean }) {
    return (
        <div className="rounded-xl border border-dashed border-border py-14 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground font-mono">{text}</p>
            {action && (
                <Button asChild size="sm" className="font-mono text-xs mt-2">
                    <Link href="/markets">Browse markets <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
            )}
        </div>
    );
}

function BetRow({ bet, onClaim, isClaiming }: { bet: any; onClaim: (id: number) => void; isClaiming: boolean }) {
    const yesAmount = Number(bet.position['yes-amount']) / 1_000_000;
    const noAmount  = Number(bet.position['no-amount'])  / 1_000_000;
    const userOutcome = yesAmount > noAmount ? 'YES' : 'NO';
    const userStake   = yesAmount + noAmount;

    const isResolved = bet.status !== 'active';
    const winningOutcome = bet.outcome;
    const isWinner =
        isResolved &&
        ((winningOutcome === true  && yesAmount > 0) ||
         (winningOutcome === false && noAmount  > 0));
    const claimed  = bet.position.claimed;
    const canClaim = isWinner && !claimed;

    const resolveDate = bet['resolve-date'] ? blockToDate(bet['resolve-date']) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-colors duration-200 overflow-hidden"
        >
            {/* Status accent line */}
            <div className={`h-px w-full ${
                !isResolved ? 'bg-green-500/50' :
                isWinner    ? 'bg-primary/60'   :
                              'bg-border'
            }`} />

            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                            variant="outline"
                            className={`text-[10px] font-mono px-1.5 py-0 border-border/80 ${
                                !isResolved ? 'text-green-500 border-green-500/40' : 'text-muted-foreground'
                            }`}
                        >
                            {!isResolved ? 'LIVE' : bet.status === 'cancelled' ? 'CANCELLED' : 'RESOLVED'}
                        </Badge>
                        <span className={`text-xs font-mono font-bold ${
                            userOutcome === 'YES' ? 'text-green-500' : 'text-red-500'
                        }`}>
                            {userOutcome}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                            {userStake.toFixed(4)} STX staked
                        </span>
                    </div>

                    <Link href={`/market/${bet.id}`} className="block group/link">
                        <p className="text-sm font-semibold leading-snug line-clamp-1 group-hover/link:text-primary transition-colors">
                            {bet.question}
                        </p>
                    </Link>

                    {resolveDate && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                            <Clock className="h-3 w-3" />
                            <span>{resolveDate.toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {/* Action */}
                <div className="shrink-0">
                    {!isResolved ? (
                        <Link href={`/market/${bet.id}`}>
                            <Button variant="outline" size="sm" className="font-mono text-xs h-8">
                                View <ArrowRight className="ml-1.5 h-3 w-3" />
                            </Button>
                        </Link>
                    ) : canClaim ? (
                        <Button
                            size="sm"
                            className="font-mono text-xs h-8 bg-primary hover:bg-primary/90"
                            onClick={() => onClaim(bet.id)}
                            disabled={isClaiming}
                        >
                            {isClaiming
                                ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                : <Wallet className="mr-1.5 h-3 w-3" />
                            }
                            Claim
                        </Button>
                    ) : claimed ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-green-500">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Claimed
                        </div>
                    ) : isResolved && !isWinner ? (
                        <span className="text-xs font-mono text-muted-foreground">Lost</span>
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
}
