'use client';

import { useEffect, useState } from 'react';
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wallet, TrendingUp, AlertCircle, RefreshCcw, CheckCircle } from 'lucide-react';
import { userSession, getContractConfig } from '@/lib/constants';
import { getUSDCxBalance, getUserMarkets, getMarket, getUserPosition } from '@/lib/stacks-api';
import { useConnect } from '@stacks/connect-react';
import { Cl, PostConditionMode, AnchorMode } from '@stacks/transactions';
import { toast } from 'sonner';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { RecentActivity } from '@/components/recent-activity';

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return <DashboardContent />;
}

function DashboardContent() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [balance, setBalance] = useState<number>(0);
    const [userBets, setUserBets] = useState<any[]>([]);
    const [isClaiming, setIsClaiming] = useState<number | null>(null);

    const { doContractCall } = useConnect();

    useEffect(() => {
        if (userSession.isUserSignedIn()) {
            setUserData(userSession.loadUserData());
            loadDashboardData();
        } else {
            setLoading(false);
        }
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const profile = userSession.loadUserData().profile;
            const address = profile.stxAddress.testnet;

            // 1. Get Balance
            const bal = await getUSDCxBalance(address);
            setBalance(bal);

            // 2. Get User Markets
            const marketIds = await getUserMarkets(address);
            
            // 3. Get Details for each market
            const betPromises = marketIds.map(async (id: number) => {
                try {
                    const [market, position] = await Promise.all([
                        getMarket(id),
                        getUserPosition(address, id)
                    ]);
                    
                    if (!market || !position) return null;

                    return { 
                        ...market, 
                        position, 
                        id 
                    };
                } catch (e) {
                    return null;
                }
            });

            const bets = (await Promise.all(betPromises)).filter(b => b !== null);
            setUserBets(bets.reverse()); // Show newest first

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
             const [tokenAddr, tokenName] = config.usdcx.split('.');

            await doContractCall({
                contractAddress: config.deployer,
                contractName: config.predictionMarket,
                functionName: 'claim-winnings',
                functionArgs: [
                    Cl.uint(marketId),
                    Cl.contractPrincipal(tokenAddr, tokenName)
                ],
                postConditionMode: PostConditionMode.Allow,
                anchorMode: AnchorMode.Any,
                onFinish: (data) => {
                    toast.success("Winnings claimed successfully!");
                    setTimeout(() => {
                        loadDashboardData();
                        setIsClaiming(null);
                    }, 4000);
                },
                onCancel: () => {
                    setIsClaiming(null);
                }
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to claim winnings");
            setIsClaiming(null);
        }
    };



    if (!userSession.isUserSignedIn()) {
        return (
             <main className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <Card className="max-w-md w-full text-center p-8">
                        <div className="flex justify-center mb-4">
                            <Wallet className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Connect Wallet</h1>
                        <p className="text-muted-foreground mb-6">
                            Please connect your Stacks wallet to view your dashboard.
                        </p>
                    </Card>
                </div>
            </main>
        );
    }

    const activeBets = userBets.filter(b => b.status === "active");
    const resolvedBets = userBets.filter(b => b.status !== "active");
    
    // Calculate total potential value (very rough estimate)
    const totalInvested = userBets.reduce((acc, bet) => {
        const yes = Number(bet.position['yes-amount']?.value || 0);
        const no = Number(bet.position['no-amount']?.value || 0);
        return acc + ((yes + no) / 1000000);
    }, 0);
    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            
            <div className="container py-8 md:py-12 space-y-8 flex-1">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">Manage your predictions and rewards</p>
                    </div>
                    <Button variant="outline" onClick={loadDashboardData} disabled={loading}>
                        <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">USDCx Balance</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${balance.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Available to bet
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Predictions</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeBets.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                In <strong>{activeBets.length + resolvedBets.length}</strong> total markets
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalInvested.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Lifetime volume
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bets Section (2 columns) */}
                    <div className="lg:col-span-2">
                        {/* Bets Tabs */}
                        <Tabs defaultValue="active" className="w-full">
                    <TabsList>
                        <TabsTrigger value="active">Active Bets ({activeBets.length})</TabsTrigger>
                        <TabsTrigger value="history">History ({resolvedBets.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="active" className="mt-6">
                        {loading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : activeBets.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {activeBets.map((bet) => (
                                    <BetHistoryCard key={bet.id} bet={bet} onClaim={handleClaim} isClaiming={isClaiming === bet.id} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border rounded-lg bg-muted/10">
                                <h3 className="text-lg font-medium mb-2">No active predictions</h3>
                                <p className="text-muted-foreground mb-4">You don't have any active bets right now.</p>
                                <Link href="/markets">
                                    <Button>Explore Markets</Button>
                                </Link>
                            </div>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="history" className="mt-6">
                        {loading ? (
                             <div className="flex justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : resolvedBets.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {resolvedBets.map((bet) => (
                                    <BetHistoryCard key={bet.id} bet={bet} onClaim={handleClaim} isClaiming={isClaiming === bet.id} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border rounded-lg bg-muted/10">
                                <h3 className="text-lg font-medium mb-2">No history</h3>
                                <p className="text-muted-foreground">You haven't participated in any resolved markets yet.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
                    </div>

                    {/* Recent Activity Sidebar */}
                    <div className="lg:col-span-1">
                        <RecentActivity />
                    </div>
                </div>

            </div>
            <Footer />
        </main>
    );
}

function BetHistoryCard({ bet, onClaim, isClaiming }: { bet: any, onClaim: any, isClaiming: boolean }) {
    const yesAmount = Number(bet.position['yes-amount']?.value || 0) / 1000000;
    const noAmount = Number(bet.position['no-amount']?.value || 0) / 1000000;
    
    // Determine user's outcome
    const userOutcome = yesAmount > 0 ? "YES" : (noAmount > 0 ? "NO" : "NONE");
    const userStake = yesAmount + noAmount;

    // Check if won
    const isResolved = bet.status !== "active";
    const winningOutcome = bet['winning-outcome']?.value; // boolean
    
    let isWinner = false;
    if (isResolved && winningOutcome !== undefined) {
        if (winningOutcome === true && yesAmount > 0) isWinner = true;
        if (winningOutcome === false && noAmount > 0) isWinner = true;
    }

    const claimed = bet.position.claimed?.value;
    const canClaim = isWinner && !claimed;

    return (
        <Card className="overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                
                {/* Image */}
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                     {bet['image-url']?.value || bet['image-url'] ? (
                        <img src={bet['image-url']?.value || bet['image-url']} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <TrendingUp className="h-8 w-8 text-primary/40" />
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant={isResolved ? "outline" : "default"} className={isResolved ? "" : "bg-green-500 hover:bg-green-600"}>
                            {isResolved ? (bet.status === "cancelled" ? "Cancelled" : "Resolved") : "Live"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Make ID: {bet.id}</span>
                    </div>
                    <Link href={`/market/${bet.id}`} className="hover:underline">
                        <h3 className="font-semibold text-lg leading-tight">{bet.question?.value || bet.question}</h3>
                    </Link>
                    <div className="text-sm text-muted-foreground flex gap-4">
                        <span>You predicted: <strong className={userOutcome === "YES" ? "text-green-600" : "text-red-600"}>{userOutcome}</strong></span>
                        <span>Stake: <strong>${userStake.toLocaleString()}</strong></span>
                        <span>End Date: {new Date(Number(bet['resolve-date']?.value) * 1000).toLocaleDateString()}</span> 
                         {/* Estimate block time if needed, assuming simple timestamp map for now or ignore exact date */}
                    </div>
                </div>

                {/* Status/Action */}
                <div className="flex items-center gap-4 justify-end min-w-[140px]">
                    {isResolved ? (
                        canClaim ? (
                            <Button className="w-full md:w-auto bg-green-600 hover:bg-green-700" onClick={() => onClaim(bet.id)} disabled={isClaiming}>
                                {isClaiming ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wallet className="mr-2 h-4 w-4" />}
                                Claim Winnings
                            </Button>
                        ) : claimed ? (
                            <div className="flex items-center text-green-600 font-medium">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Claimed
                            </div>
                        ) : isWinner === false && bet.status !== "cancelled" ? (
                            <div className="text-muted-foreground font-medium">
                                Not Winning
                            </div>
                        ) : null
                    ) : (
                        <div className="text-sm font-medium text-muted-foreground text-center">
                            In Progress
                        </div>
                    )}
                </div>

            </div>
        </Card>
    );
}
