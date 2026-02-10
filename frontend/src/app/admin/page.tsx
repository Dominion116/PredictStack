
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useConnect } from '@stacks/connect-react';
import { getContractConfig, userSession, isUserSignedIn } from '@/lib/constants';
import { getRecentMarkets } from '@/lib/stacks-api';
import { Loader2, ShieldAlert, CheckCircle, XCircle, Gavel, Filter } from 'lucide-react';
import { Footer } from "@/components/footer";
import { toast } from 'sonner';
import { 
    uintCV, 
    trueCV, 
    falseCV, 
    stringAsciiCV,
    someCV,
    noneCV,
    PostConditionMode
} from '@stacks/transactions';

export default function AdminPage() {
    const [mounted, setMounted] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        setMounted(true);
        if (isUserSignedIn()) {
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
    const [activeTab, setActiveTab] = useState('create');
    const [markets, setMarkets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Form State
    const activeMarkets = markets.filter(m => m.status === 'active' || m.status === '0' || m.status === 0);
    const resolvedMarkets = markets.filter(m => m.status === 'resolved' || m.status === '1' || m.status === 1);
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [resolveDate, setResolveDate] = useState('');
    const [category, setCategory] = useState('Crypto');
    const [imageUrl, setImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const CURRENT_BLOCK_HEIGHT = 3750000;
    const SECONDS_PER_BLOCK = 600;

    const estimatedBlock = useMemo(() => {
        if (!resolveDate) return 0;
        const targetTime = new Date(resolveDate).getTime();
        const now = Date.now();
        const secondsUntilResolve = Math.max(0, (targetTime - now) / 1000);
        const blocksUntilResolve = Math.ceil(secondsUntilResolve / SECONDS_PER_BLOCK);
        return CURRENT_BLOCK_HEIGHT + blocksUntilResolve;
    }, [resolveDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const fetchedMarkets = await getRecentMarkets(100);
            setMarkets(fetchedMarkets);
        } catch (error) {
            console.error("Failed to load markets:", error);
            toast.error("Failed to load markets.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be less than 2MB');
            return;
        }
        const localUrl = URL.createObjectURL(file);
        setPreviewUrl(localUrl);
        setIsUploading(true);
        try {
            const { uploadToPinata } = await import('@/lib/pinata');
            const result = await uploadToPinata(file, `market-image-${Date.now()}`);
            if (result.success && result.ipfsUrl) {
                setImageUrl(result.ipfsUrl);
                toast.success('Image uploaded to IPFS!');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload image');
            setImageUrl('');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateMarket = async (e: React.FormEvent) => {
        e.preventDefault();
        const config = getContractConfig();

        if (!question || !resolveDate) {
            toast.error('Question and Resolution Date are required');
            return;
        }

        if (estimatedBlock <= CURRENT_BLOCK_HEIGHT + 144) {
            toast.error('Resolution date must be at least 24 hours in the future');
            return;
        }

        try {
            setIsSubmitting(true);

            await doContractCall({
                network: 'testnet',
                contractAddress: config.deployer,
                contractName: config.predictionMarket,
                functionName: 'create-market',
                functionArgs: [
                    stringAsciiCV(question),
                    description ? someCV(stringAsciiCV(description)) : noneCV(),
                    uintCV(estimatedBlock),
                    imageUrl ? someCV(stringAsciiCV(imageUrl)) : noneCV(),
                ],
                postConditionMode: PostConditionMode.Allow,
                onFinish: (data) => {
                    toast.success('Market created successfully!');
                    setQuestion('');
                    setDescription('');
                    setResolveDate('');
                    setPreviewUrl(null);
                    setImageUrl('');
                    setIsSubmitting(false);
                    setTimeout(loadData, 2000);
                },
                onCancel: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to create market');
            setIsSubmitting(false);
        }
    };

    const handleResolve = async (marketId: number, outcome: boolean) => {
        setProcessingId(marketId);
        const config = getContractConfig();
        try {
            await doContractCall({
                network: 'testnet',
                contractAddress: config.deployer,
                contractName: config.predictionMarket,
                functionName: 'resolve-market',
                functionArgs: [uintCV(marketId), outcome ? trueCV() : falseCV()],
                postConditionMode: PostConditionMode.Allow,
                onFinish: (data) => {
                    toast.success(`Market ${marketId} resolved as ${outcome ? 'YES' : 'NO'}!`);
                    setProcessingId(null);
                    setTimeout(loadData, 2000);
                },
                onCancel: () => {
                    setProcessingId(null);
                }
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to resolve market');
            setProcessingId(null);
        }
    };

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
                            onClick={() => setActiveTab('create')}
                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors flex justify-between items-center ${activeTab === 'create' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                        >
                            Create Market
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
                        
                        <TabsContent value="create" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold tracking-tight">Create New Market</h2>
                            </div>

                            <Card>
                                <CardContent className="pt-6">
                                    <form onSubmit={handleCreateMarket} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="question">Market Question</Label>
                                            <Input 
                                                id="question" 
                                                placeholder="e.g. Will Bitcoin reach $100k by end of year?" 
                                                value={question}
                                                onChange={(e) => setQuestion(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="category">Category</Label>
                                                <select 
                                                    id="category"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                >
                                                    <option value="Crypto">Crypto</option>
                                                    <option value="Politics">Politics</option>
                                                    <option value="Sports">Sports</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="resolveDate">Resolution Date</Label>
                                                <Input 
                                                    id="resolveDate" 
                                                    type="datetime-local" 
                                                    value={resolveDate}
                                                    onChange={(e) => setResolveDate(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="image">Market Image</Label>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 relative">
                                                    <input 
                                                        type="file" 
                                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                                        onChange={handleFileChange}
                                                        accept="image/*"
                                                        disabled={isUploading}
                                                    />
                                                    {previewUrl ? (
                                                        <img src={previewUrl} className="h-20 mx-auto rounded" alt="Preview"/>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">
                                                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mx-auto"/> : "Click to upload image"}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description (Markdown supported)</Label>
                                            <Textarea 
                                                id="description" 
                                                placeholder="Market rules and outcome conditions..." 
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
                                        </div>

                                        <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            {isSubmitting ? "Creating Market..." : "Create Market"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
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
                                                            ${(Number(market['yes-pool']) / 1000000).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 bg-red-50 p-3 rounded-md text-center border border-red-100">
                                                        <div className="text-xs text-muted-foreground uppercase mb-1">No Pool</div>
                                                        <div className="font-bold text-red-700">
                                                            ${(Number(market['no-pool']) / 1000000).toLocaleString()}
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
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Markets</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-orange-500">{activeMarkets.length}</div>
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
