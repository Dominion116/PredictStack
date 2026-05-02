
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { defaultTransition } from '@/lib/animations';
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getContractConfig, userSession, isUserSignedIn } from '@/lib/constants';
import { createMarketRecord, getRecentMarkets, resolveMarketRecord } from '@/lib/stacks-api';
import { blockToDate } from '@/lib/date-utils';
import { Loader2, ShieldAlert, Gavel, Menu, X } from 'lucide-react';
import { Footer } from "@/components/footer";
import { toast } from 'sonner';

type MarketRecord = {
    id: number;
    status: string | number;
    backendId?: string;
    question: string;
    'resolve-date': number;
    'yes-pool': number | string;
    'no-pool': number | string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};

export default function AdminPage() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        let isActive = true;
        const timer = setTimeout(() => {
            if (!isActive) return;
            if (isUserSignedIn()) {
                const userData = userSession.loadUserData();
                const userAddress = userData.profile.stxAddress.testnet;
                const config = getContractConfig();
                setIsAdmin(userAddress === config.deployer);
            } else {
                setIsAdmin(false);
            }
        }, 0);

        return () => {
            isActive = false;
            clearTimeout(timer);
        };
    }, []);

    if (isAdmin === null) {
        return (
            <main className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="container py-12 flex-1">
                    <div className="space-y-6 animate-pulse">
                        <div className="h-9 w-48 rounded-md bg-muted" />
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="h-24 rounded-lg bg-muted" />
                            <div className="h-24 rounded-lg bg-muted" />
                            <div className="h-24 rounded-lg bg-muted" />
                        </div>
                        <div className="h-64 rounded-lg bg-muted" />
                    </div>
                </div>
                <Footer />
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
    const [activeTab, setActiveTab] = useState('create');
    const [markets, setMarkets] = useState<MarketRecord[]>([]);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Form State
    const activeMarkets = markets.filter(m => m.status === 'active' || m.status === '0' || m.status === 0);
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
        try {
            const fetchedMarkets = await getRecentMarkets(100);
            setMarkets(fetchedMarkets);
        } catch (error) {
            console.error("Failed to load markets:", error);
            toast.error("Failed to load markets.");
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
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to upload image'));
            setImageUrl('');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateMarket = async (e: React.FormEvent) => {
        e.preventDefault();
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
            const userData = userSession.loadUserData();
            const createdBy = userData.profile.stxAddress.testnet;

            await createMarketRecord({
                question,
                description,
                category,
                imageUrl,
                resolveDate,
                resolveBlock: estimatedBlock,
                createdBy,
            });

            toast.success('Market stored and signed successfully!');
            setQuestion('');
            setDescription('');
            setResolveDate('');
            setPreviewUrl(null);
            setImageUrl('');
            setIsSubmitting(false);
            setTimeout(loadData, 2000);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to create market'));
            setIsSubmitting(false);
        }
    };

    const handleResolve = async (marketId: number, outcome: boolean) => {
        setProcessingId(marketId);
        try {
            const market = markets.find(item => item.id === marketId);
            if (!market?.backendId) {
                throw new Error('Missing backend market reference');
            }
            await resolveMarketRecord(market.backendId, outcome);
            toast.success(`Market ${marketId} resolved as ${outcome ? 'YES' : 'NO'}!`);
            setProcessingId(null);
            setTimeout(loadData, 2000);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to resolve market'));
            setProcessingId(null);
        }
    };

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            
            <div className="flex-1 flex flex-col md:flex-row relative">
                {/* Mobile/Desktop Sidebar Toggle */}
                <Button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 left-4 z-50 md:hidden"
                >
                    {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {/* Sidebar */}
                <motion.aside 
                    className={`${sidebarOpen ? 'w-full md:w-64' : 'w-0 md:w-16'} border-r bg-muted/20 p-6 flex flex-col gap-6 overflow-hidden transition-all duration-300`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={defaultTransition}
                >
                    <div className="flex items-center justify-between">
                        {sidebarOpen && <div className="font-semibold text-lg px-2">Admin</div>}
                        <Button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            variant="ghost"
                            size="icon"
                            className="hidden md:inline-flex"
                        >
                            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </Button>
                    </div>
                    <nav className="space-y-2">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'overview' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                            title={!sidebarOpen ? 'Overview' : ''}
                        >
                            {sidebarOpen ? 'Overview' : '📊'}
                        </button>
                        <button 
                            onClick={() => setActiveTab('create')}
                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors flex justify-between items-center ${activeTab === 'create' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                            title={!sidebarOpen ? 'Create Market' : ''}
                        >
                            {sidebarOpen ? 'Create Market' : '➕'}
                        </button>
                        <button 
                            onClick={() => setActiveTab('resolve')}
                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'resolve' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                            title={!sidebarOpen ? 'Resolve Betting' : ''}
                        >
                            {sidebarOpen ? 'Resolve Betting' : '🏛️'}
                        </button>
                    </nav>
                </motion.aside>

                {/* Main Content */}
                <motion.div 
                    className="flex-1 p-8 space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...defaultTransition, delay: 0.1 }}
                >
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
                                                        <Image
                                                            src={previewUrl}
                                                            width={80}
                                                            height={80}
                                                            className="h-20 w-20 mx-auto rounded object-cover"
                                                            alt="Preview"
                                                        />
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
                                            <CardTitle className="flex justify-between">
                                                {market.question}
                                                <Badge variant="outline">ID: {market.id}</Badge>
                                            </CardTitle>
                                            <CardDescription>Ends: {blockToDate(market['resolve-date']).toLocaleDateString()}</CardDescription>
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
                                        <div className="text-2xl font-bold text-primary">{activeMarkets.length}</div>
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
                </motion.div>
            </div>
            <Footer />
        </main>
    );
}
