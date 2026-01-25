
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from "@/components/navbar";
import { getMarket, getUSDCxBalance, getUserPosition } from '@/lib/stacks-api';
import { Footer } from "@/components/footer";
import { blockToDate, formatResolutionDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, Clock, AlertCircle, Trophy, Wallet, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useConnect } from '@stacks/connect-react';
import { userSession, getContractConfig } from '@/lib/constants';
import { 
    PostConditionMode, 
    AnchorMode,
    Cl,
    Pc
} from '@stacks/transactions';

export default function MarketPage() {
    const params = useParams();
    const marketId = Number(params.id);
    const { doContractCall } = useConnect();

    const [market, setMarket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [betAmount, setBetAmount] = useState('');
    const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO'>('YES');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userBalance, setUserBalance] = useState<number | null>(null);
    const [userPosition, setUserPosition] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            if (isNaN(marketId)) return;
            try {
                const data = await getMarket(marketId);
                setMarket(data);

                if (userSession.isUserSignedIn()) {
                    const userData = userSession.loadUserData();
                    const address = userData.profile.stxAddress.testnet;
                    
                    const [balance, position] = await Promise.all([
                        getUSDCxBalance(address),
                        getUserPosition(address, marketId)
                    ]);
                    
                    setUserBalance(balance);
                    setUserPosition(position);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [marketId]);

    const handleBet = async () => {
        if (!userSession.isUserSignedIn()) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!betAmount || isNaN(Number(betAmount)) || Number(betAmount) <= 0) {
            toast.error("Please enter a valid bet amount");
            return;
        }

        setIsSubmitting(true);
        const config = getContractConfig();
        const amountMicro = Math.floor(Number(betAmount) * 1000000); // USDCx is 6 decimals
        
        try {
            const userData = userSession.loadUserData();
            const userAddress = userData.profile.stxAddress.testnet;
            const [tokenAddr, tokenName] = config.usdcx.split('.');
            const outcome = selectedOutcome === 'YES';

            // Define post-condition: user sends exactly amountMicro to the contract
            const postCondition = Pc.principal(userAddress)
                .willSendEq(amountMicro)
                .ft(`${tokenAddr}.${tokenName}`, 'usdcx');
            
            await doContractCall({
                contractAddress: config.deployer,
                contractName: config.predictionMarket,
                functionName: 'place-bet',
                functionArgs: [
                    Cl.uint(marketId),
                    Cl.bool(outcome),
                    Cl.uint(amountMicro),
                    Cl.contractPrincipal(tokenAddr, tokenName)
                ],
                postConditions: [postCondition],
                postConditionMode: PostConditionMode.Deny,
                anchorMode: AnchorMode.Any,
                onFinish: (data) => {
                    toast.success(`Bet submitted! ID: ${data.txId}`);
                    setIsSubmitting(false);
                    setBetAmount('');
                    // Update balance after a short delay
                    setTimeout(async () => {
                        const newBalance = await getUSDCxBalance(userAddress);
                        setUserBalance(newBalance);
                    }, 4000);
                },
                onCancel: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to place bet");
            setIsSubmitting(false);
        }
    };

    const handleClaim = async () => {
        if (!userSession.isUserSignedIn()) return;
        
        setIsSubmitting(true);
        const config = getContractConfig();
        
        try {
            const userData = userSession.loadUserData();
            const userAddress = userData.profile.stxAddress.testnet;
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
                    toast.success("Winnings claimed! Processing...");
                    setTimeout(async () => {
                        const [newBalance, newPosition] = await Promise.all([
                            getUSDCxBalance(userAddress),
                            getUserPosition(userAddress, marketId)
                        ]);
                        setUserBalance(newBalance);
                        setUserPosition(newPosition);
                        setIsSubmitting(false);
                    }, 5000);
                },
                onCancel: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to claim");
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </main>
        );
    }

    if (!market) {
        return (
            <main className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Market Not Found</h1>
                    <p className="text-muted-foreground">The market you are looking for does not exist.</p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/markets'}>
                        Back to Markets
                    </Button>
                </div>
            </main>
        );
    }

    // Parse Data
    const question = market.question?.value || market.question || 'Unknown Market';
    const imageUrl = market['image-url']?.value || market['image-url'];
    const category = market.category?.value || market.category || 'General';
    const resolveBlock = market['resolve-date']?.value ? Number(market['resolve-date'].value) : 0;
    
    // Pools
    const yesPoolRaw = market['yes-pool']?.value || market['yes-pool'] || 0;
    const noPoolRaw = market['no-pool']?.value || market['no-pool'] || 0;
    const yesPool = Number(yesPoolRaw) / 1000000;
    const noPool = Number(noPoolRaw) / 1000000;
    const totalPool = yesPool + noPool;

    const yesPercent = totalPool > 0 ? (yesPool / totalPool) * 100 : 50;
    const noPercent = totalPool > 0 ? (noPool / totalPool) * 100 : 50;
    
    // Odds/Multiplier
    const yesMultiplier = yesPool > 0 ? (totalPool / yesPool).toFixed(2) : '2.00';
    const noMultiplier = noPool > 0 ? (totalPool / noPool).toFixed(2) : '2.00';

    // Time
    const resolutionDate = resolveBlock > 0 ? blockToDate(resolveBlock) : null;
    const timeDisplay = resolutionDate ? formatResolutionDate(resolutionDate) : "Active";

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            
            <div className="container py-8 md:py-12 flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Market Details (Left Column) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Image */}
                        <div className="relative rounded-2xl overflow-hidden aspect-video md:aspect-[2.5/1] bg-muted">
                            {imageUrl ? (
                                <img src={imageUrl} alt={question} className="w-full h-full object-cover" />

                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <TrendingUp className="h-16 w-16 text-primary/30" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4">
                                <Badge className="text-sm px-3 py-1 bg-background/90 text-foreground backdrop-blur-md shadow-sm">
                                    {category}
                                </Badge>
                            </div>
                        </div>

                        {/* Title & Stats */}
                        <div className="space-y-4">
                            <h1 className="text-2xl md:text-3xl font-bold leading-tight">{question}</h1>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                                    <Clock className="w-4 h-4" />
                                    <span>{timeDisplay}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                                    <Trophy className="w-4 h-4" />
                                    <span>${totalPool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Volume</span>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="border-green-500/20 bg-green-500/5">
                                <CardContent className="p-6 text-center">
                                    <div className="text-sm text-muted-foreground mb-1">YES Outcome</div>
                                    <div className="text-3xl font-bold text-green-600">{yesPercent.toFixed(1)}%</div>
                                    <div className="text-sm font-medium mt-1">Multiplier: {yesMultiplier}x</div>
                                </CardContent>
                            </Card>
                            <Card className="border-red-500/20 bg-red-500/5">
                                <CardContent className="p-6 text-center">
                                    <div className="text-sm text-muted-foreground mb-1">NO Outcome</div>
                                    <div className="text-3xl font-bold text-red-600">{noPercent.toFixed(1)}%</div>
                                    <div className="text-sm font-medium mt-1">Multiplier: {noMultiplier}x</div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
                            <div 
                                className="h-full bg-green-500 transition-all duration-1000" 
                                style={{ width: `${yesPercent}%` }}
                            />
                            <div 
                                className="h-full bg-red-500 transition-all duration-1000" 
                                style={{ width: `${noPercent}%` }}
                            />
                        </div>

                        <div className="prose dark:prose-invert max-w-none">
                            <h3 className="text-lg font-semibold mb-2">Market Description</h3>
                            <p className="text-muted-foreground whitespace-pre-wrap">
                                {market.description?.value || market.description || "No specific details provided for this market. Resolution will be based on the general consensus of the oracle/admin."}
                            </p>
                        </div>
                    </div>

                    {/* Betting Panel (Right Column) */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 shadow-lg border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-primary" />
                                    Place Bet
                                </CardTitle>
                                <CardDescription>
                                    Predict the outcome with USDCx
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Tabs value={selectedOutcome} onValueChange={(v) => setSelectedOutcome(v as 'YES' | 'NO')} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 h-12">
                                        <TabsTrigger 
                                            value="YES" 
                                            className="h-full data-[state=active]:bg-green-500 data-[state=active]:text-white font-bold"
                                        >
                                            YES
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="NO" 
                                            className="h-full data-[state=active]:bg-red-500 data-[state=active]:text-white font-bold"
                                        >
                                            NO
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <label className="font-medium">Amount</label>
                                        <span className="text-muted-foreground">
                                            Balance: {userBalance !== null ? `${userBalance.toLocaleString()} USDCx` : '--'}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input 
                                            type="number" 
                                            placeholder="0.00" 
                                            className="pl-7 text-lg h-12"
                                            value={betAmount}
                                            onChange={(e) => setBetAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Potential Payout</span>
                                        <span className="font-semibold">
                                            ${(Number(betAmount || 0) * Number(selectedOutcome === 'YES' ? yesMultiplier : noMultiplier)).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Est. ROI</span>
                                        <span className={`font-semibold ${selectedOutcome === 'YES' ? 'text-green-500' : 'text-red-500'}`}>
                                            +
                                            {((Number(selectedOutcome === 'YES' ? yesMultiplier : noMultiplier) - 1) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>

                                <Button 
                                    className={`w-full h-12 text-lg font-bold ${selectedOutcome === 'YES' ? 'hover:bg-green-600' : 'hover:bg-red-600'}`}
                                    onClick={handleBet}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Confirming...
                                        </>
                                    ) : (
                                        `Bet ${selectedOutcome}`
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* User Position Card */}
                        {userSession.isUserSignedIn() && userPosition && (
                            <Card className="mt-6 border-primary/20 bg-primary/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        Your Position
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">YES Position</span>
                                        <span className="font-semibold">${(Number(userPosition['yes-amount']?.value || 0) / 1000000).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">NO Position</span>
                                        <span className="font-semibold">${(Number(userPosition['no-amount']?.value || 0) / 1000000).toLocaleString()}</span>
                                    </div>
                                    
                                    {/* Claim Section */}
                                    {market.status === 'resolved' && !userPosition.claimed?.value && (
                                        <div className="pt-2">
                                            <Button 
                                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                                onClick={handleClaim}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Claim Winnings
                                            </Button>
                                        </div>
                                    )}
                                    {userPosition.claimed?.value && (
                                        <div className="pt-2 text-center text-sm font-medium text-green-600">
                                            Winnings Claimed ✓
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                </div>
            </div>
            <Footer />
        </main>
    );
}
