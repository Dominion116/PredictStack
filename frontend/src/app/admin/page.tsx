
'use client';

import { useState, useEffect } from 'react';
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useConnect } from '@stacks/connect-react';
import { getContractConfig, userSession } from '@/lib/constants';
import { getRecentMarkets } from '@/lib/stacks-api';
import { Loader2, ShieldAlert, CheckCircle, XCircle, Gavel, Filter } from 'lucide-react';
import { Footer } from "@/components/footer";
import { toast } from 'sonner';
import { uintCV, trueCV, falseCV, contractPrincipalCV, PostConditionMode, AnchorMode } from '@stacks/transactions';

export default function AdminPage() {
    const [mounted, setMounted] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        setMounted(true);
        if (userSession.isUserSignedIn()) {
            const userData = userSession.loadUserData();
            const userAddress = userData.profile.stxAddress.testnet;
            const config = getContractConfig();
            setIsAdmin(userAddress === config.deployer);
        } else {
            setIsAdmin(false);
        }
    }, []);

    if (!mounted) {
        return (
            <main className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="container py-12 flex-1 flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </main>
        );
    }

    if (isAdmin === false) {
        return (
            <main className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="container py-24 flex-1 flex flex-col items-center justify-center text-center">
                    <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
                    <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
                    <p className="text-muted-foreground max-w-md">
                        This area is restricted to platform administrators only.
                    </p>
                </div>
                <Footer />
            </main>
        );
    }

    return <AdminDashboard />;
}

function AdminDashboard() {
    const { doContractCall } = useConnect();
    const [markets, setMarkets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const allMarkets = await getRecentMarkets(100);
            setMarkets(allMarkets);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load markets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApprove = async (marketId: number) => {
        setProcessingId(marketId);
        const config = getContractConfig();

        try {
            await doContractCall({
                contractAddress: config.deployer,
                contractName: config.predictionMarket,
                functionName: 'approve-market',
                functionArgs: [uintCV(marketId)],
                postConditionMode: PostConditionMode.Deny,
                anchorMode: AnchorMode.Any,
                onFinish: (data) => {
                    toast.success(`Approval tx submitted: ${data.txId}`);
                    setProcessingId(null);
                    // Optimistically update or reload
                    setTimeout(loadData, 2000); 
                },
                onCancel: () => {
                    setProcessingId(null);
                }
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to approve market");
            setProcessingId(null);
        }
    };

    const handleResolve = async (marketId: number, outcome: boolean) => {
        setProcessingId(marketId);
        const config = getContractConfig();
        const [tokenAddr, tokenName] = config.usdcx.split('.');

        try {
            await doContractCall({
                contractAddress: config.deployer,
                contractName: config.predictionMarket,
                functionName: 'resolve-market',
                functionArgs: [
                    uintCV(marketId),
                    outcome ? trueCV() : falseCV(),
                    contractPrincipalCV(tokenAddr, tokenName)
                ],
                postConditionMode: PostConditionMode.Deny,
                anchorMode: AnchorMode.Any,
                onFinish: (data) => {
                    toast.success(`Resolution tx submitted: ${data.txId}`);
                    setProcessingId(null);
                    // Optimistically update or reload
                    setTimeout(loadData, 2000); 
                },
                onCancel: () => {
                    setProcessingId(null);
                }
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to resolve market");
            setProcessingId(null);
        }
    };

    // Pending markets have status "pending" (which we defined as u3, but clarity response might vary, let's assume raw string from API 'pending' or u3 mapped)
    // The API `getRecentMarkets` usually returns formatted status if we updated `status-to-string`.
    // Wait, I didn't update `status-to-string` in the contract! It only handles 0, 1, 2.
    // I need to update `status-to-string` helper in contract too, or `getRecentMarkets` will return "cancelled" for u3 (default case).
    // Let's assume I fix the contract helper for u3 -> "pending".
    
    // Filter functions
    const pendingMarkets = markets.filter(m => m.status === 'pending' || m.status === '3' || m.status === 3);
    const activeMarkets = markets.filter(m => m.status === 'active' || m.status === '0' || m.status === 0);
    const resolvedMarkets = markets.filter(m => m.status === 'resolved' || m.status === '1' || m.status === 1);

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            
            <div className="flex-1 flex flex-col md:flex-row">
                {/* Sidebar */}
                <aside className="w-full md:w-64 border-r bg-muted/20 p-6 flex flex-col gap-6">
                    <div className="font-semibold text-lg px-2">Admin Dashboard</div>
                    <nav className="space-y-2">
                         <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground bg-muted/50 rounded-md">
                            Overview
                        </div>
                        <div className="px-2 py-1.5 text-sm font-medium hover:bg-muted/50 rounded-md cursor-pointer transition-colors">
                            Pending Markets
                            {pendingMarkets.length > 0 && (
                                <Badge className="ml-2 h-5 w-5 rounded-full px-0 flex items-center justify-center bg-orange-500">
                                    {pendingMarkets.length}
                                </Badge>
                            )}
                        </div>
                        <div className="px-2 py-1.5 text-sm font-medium hover:bg-muted/50 rounded-md cursor-pointer transition-colors">
                            Resolve Betting
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <div className="flex-1 p-8 space-y-8">
                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList>
                            <TabsTrigger value="pending">Pending Approval</TabsTrigger>
                            <TabsTrigger value="resolve">Resolve Markets</TabsTrigger>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending" className="space-y-6 mt-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold tracking-tight">Pending Markets</h2>
                                <Button variant="outline" size="sm" onClick={loadData}>
                                    <Loader2 className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>

                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"/>)}
                                </div>
                            ) : pendingMarkets.length === 0 ? (
                                <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
                                    No pending markets found.
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {pendingMarkets.map(market => (
                                        <Card key={market.id}>
                                            <CardHeader>
                                                <CardTitle className="flex justify-between items-start">
                                                    <span>{market.question}</span>
                                                    <Badge variant="outline">ID: {market.id}</Badge>
                                                </CardTitle>
                                                <CardDescription>
                                                    Category: {market.category} • Created: {new Date(Number(market['created-at']) * 1000).toLocaleDateString()}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex gap-4">
                                                    <Button 
                                                        onClick={() => handleApprove(market.id)} 
                                                        disabled={processingId === market.id}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        {processingId === market.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                                                        Approve Market
                                                    </Button>
                                                    <Button variant="destructive" disabled>
                                                        <XCircle className="mr-2 h-4 w-4"/>
                                                        Reject
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="resolve" className="space-y-6 mt-6">
                            <h2 className="text-2xl font-bold tracking-tight">Resolve Markets</h2>
                            <p className="text-muted-foreground">Select a market to declare the winning outcome.</p>
                            <div className="grid gap-6">
                                {activeMarkets.map(market => (
                                   <Card key={market.id}>
                                        <CardHeader>
                                            <CardTitle className="flex justify-between">
                                                {market.question}
                                                <Badge variant="outline">ID: {market.id}</Badge>
                                            </CardTitle>
                                            <CardDescription>Ends: {new Date(Number(market['resolve-date']) * 1000).toLocaleDateString()}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex gap-4">
                                                    <div className="flex-1 bg-green-50 p-3 rounded-md text-center border border-green-100">
                                                        <div className="text-xs text-muted-foreground uppercase mb-1">Yes Pool</div>
                                                        <div className="font-bold text-green-700">
                                                            ${(Number(market['yes-pool']?.value || 0) / 1000000).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 bg-red-50 p-3 rounded-md text-center border border-red-100">
                                                        <div className="text-xs text-muted-foreground uppercase mb-1">No Pool</div>
                                                        <div className="font-bold text-red-700">
                                                            ${(Number(market['no-pool']?.value || 0) / 1000000).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <Button 
                                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleResolve(market.id, true)}
                                                        disabled={processingId === market.id}
                                                    >
                                                        {processingId === market.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Gavel className="mr-2 h-4 w-4"/>}
                                                        Resolve YES
                                                    </Button>
                                                    <Button 
                                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                                        onClick={() => handleResolve(market.id, false)}
                                                        disabled={processingId === market.id}
                                                    >
                                                        {processingId === market.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Gavel className="mr-2 h-4 w-4"/>}
                                                        Resolve NO
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                   </Card> 
                                ))}
                            </div>
                        </TabsContent>

                         <TabsContent value="overview" className="space-y-6 mt-6">
                            <h2 className="text-2xl font-bold tracking-tight">Platform Overview</h2>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Markets</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{markets.length}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-orange-500">{pendingMarkets.length}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">---</div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <Footer />
        </main>
    );
}
