
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
    const [activeTab, setActiveTab] = useState('pending');

    const loadData = async () => {
        // ... (existing code)
    };

    // ... (useEffect and handlers)

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            
            <div className="flex-1 flex flex-col md:flex-row">
                {/* Sidebar */}
                <aside className="w-full md:w-64 border-r bg-muted/20 p-6 flex flex-col gap-6">
                    <div className="font-semibold text-lg px-2">Admin Dashboard</div>
                    <nav className="space-y-2">
                         <button 
                            onClick={() => setActiveTab('overview')}
                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'overview' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                         >
                            Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('pending')}
                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors flex justify-between items-center ${activeTab === 'pending' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                        >
                            Pending Markets
                            {pendingMarkets.length > 0 && (
                                <Badge className="ml-2 h-5 w-5 rounded-full px-0 flex items-center justify-center bg-orange-500 hover:bg-orange-600">
                                    {pendingMarkets.length}
                                </Badge>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('resolve')}
                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'resolve' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                        >
                            Resolve Betting
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <div className="flex-1 p-8 space-y-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        
                        <TabsContent value="pending" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold tracking-tight">Pending Markets</h2>
                                <Button variant="outline" size="sm" onClick={loadData}>
                                    <Loader2 className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                            
                            {/* ... Content ... */}
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

                        <TabsContent value="resolve" className="space-y-6">
                            <h2 className="text-2xl font-bold tracking-tight">Resolve Markets</h2>
                            <p className="text-muted-foreground">Select a market to declare the winning outcome.</p>
                            <div className="grid gap-6">
                                {activeMarkets.map(market => (
                                   <Card key={market.id}>
                                        <CardHeader>
// ... existing content ...
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
