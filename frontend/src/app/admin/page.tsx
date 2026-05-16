'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { defaultTransition } from '@/lib/animations';
import { Navbar } from "@/components/navbar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getContractConfig, userSession, isUserSignedIn, getUserAddress, NETWORK_ENV } from '@/lib/constants';
import { createMarketRecord, getRecentMarkets, resolveMarketRecord, getNextMarketId } from '@/lib/stacks-api';
import { useConnect } from '@stacks/connect-react';
import { blockToDate } from '@/lib/date-utils';
import {
    Loader2, ShieldAlert, Gavel, LayoutDashboard,
    PlusCircle, CheckSquare, ChevronRight, Upload,
    BarChart3, Zap, Globe,
} from 'lucide-react';
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

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview',      icon: LayoutDashboard },
    { id: 'create',   label: 'Create Market', icon: PlusCircle      },
    { id: 'resolve',  label: 'Resolve',       icon: CheckSquare     },
];

export default function AdminPage() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        let active = true;
        const t = setTimeout(() => {
            if (!active) return;
            if (isUserSignedIn()) {
                const profile  = userSession.loadUserData().profile;
                const deployer = getContractConfig().deployer.trim().toLowerCase();
                // Compare both address formats — wallet may return testnet (ST…) or
                // mainnet (SP…) depending on how it was configured, and the deployer
                // env var may be stored in either format.
                const testnet = (profile.stxAddress?.testnet ?? '').trim().toLowerCase();
                const mainnet = (profile.stxAddress?.mainnet ?? '').trim().toLowerCase();
                setIsAdmin(testnet === deployer || mainnet === deployer);
            } else {
                setIsAdmin(false);
            }
        }, 0);
        return () => { active = false; clearTimeout(t); };
    }, []);

    if (isAdmin === null) return <AdminSkeleton />;
    if (isAdmin === false) return <AccessDenied />;
    return <AdminDashboard />;
}

function AdminSkeleton() {
    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <div className="flex-1 flex">
                <div className="w-56 border-r border-border/60 bg-muted/20 p-4 space-y-2 animate-pulse">
                    {[0, 1, 2].map(i => <div key={i} className="h-9 rounded-lg bg-muted" />)}
                </div>
                <div className="flex-1 p-8 space-y-6 animate-pulse">
                    <div className="h-8 w-48 rounded bg-muted" />
                    <div className="grid grid-cols-3 gap-4">
                        {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-muted" />)}
                    </div>
                    <div className="h-64 rounded-xl bg-muted" />
                </div>
            </div>
        </main>
    );
}

function AccessDenied() {
    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="h-16 w-16 rounded-2xl border border-destructive/40 bg-destructive/10 flex items-center justify-center">
                    <ShieldAlert className="h-7 w-7 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground text-sm max-w-sm">
                    This area is restricted to platform administrators only.
                </p>
            </div>
            <Footer />
        </main>
    );
}

function AdminDashboard() {
    const { doContractCall } = useConnect();

    const [activeTab,      setActiveTab]      = useState('create');
    const [markets,        setMarkets]        = useState<MarketRecord[]>([]);
    const [processingId,   setProcessingId]   = useState<number | null>(null);
    const [currentBlock,   setCurrentBlock]   = useState<number>(0);
    const [blockFetching,  setBlockFetching]  = useState(true);
    const [isInitialized,  setIsInitialized]  = useState<boolean | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);

    const activeMarkets = markets.filter(
        m => m.status === 'active' || m.status === '0' || m.status === 0
    );

    // Form state
    const [question,    setQuestion]    = useState('');
    const [description, setDescription] = useState('');
    const [resolveDate, setResolveDate] = useState('');
    const [category,    setCategory]    = useState('Crypto');
    const [imageUrl,    setImageUrl]    = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const SECS_PER_BLOCK = 600;

    // Fetch the real current Stacks block height — never use a hardcoded value
    const fetchCurrentBlock = async () => {
        setBlockFetching(true);
        try {
            const network = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
            const apiUrl  = network === 'mainnet'
                ? 'https://api.mainnet.hiro.so'
                : 'https://api.testnet.hiro.so';
            const res  = await fetch(`${apiUrl}/v2/info`);
            const data = await res.json();
            setCurrentBlock(data.stacks_tip_height ?? data.burn_block_height ?? 0);
        } catch {
            toast.error('Could not fetch current block height — block estimate may be inaccurate.');
        } finally {
            setBlockFetching(false);
        }
    };

    // resolveBlock = currentBlock + blocks-until-resolve-date
    const estimatedBlock = useMemo(() => {
        if (!resolveDate || !currentBlock) return 0;
        const secs   = Math.max(0, (new Date(resolveDate).getTime() - Date.now()) / 1000);
        const blocks = Math.max(1, Math.ceil(secs / SECS_PER_BLOCK));
        return currentBlock + blocks;
    }, [resolveDate, currentBlock]);

    const loadData = async () => {
        try {
            setMarkets(await getRecentMarkets(100));
        } catch {
            toast.error('Failed to load markets.');
        }
    };

    const checkInitialized = async () => {
        try {
            const config = getContractConfig();
            const apiUrl = NETWORK_ENV === 'mainnet'
                ? 'https://api.mainnet.hiro.so'
                : 'https://api.testnet.hiro.so';
            const res = await fetch(
                `${apiUrl}/v2/contracts/call-read/${config.deployer}/${config.predictionMarket}/is-initialized`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sender: config.deployer, arguments: [] }) }
            );
            const data = await res.json();
            // result "0x0703" = (ok false), "0x0704" = (ok true)
            setIsInitialized(data.result === '0x0704');
        } catch {
            setIsInitialized(null);
        }
    };

    const handleInitialize = async () => {
        setIsInitializing(true);
        try {
            const [tx, net] = await Promise.all([
                import('@stacks/transactions'),
                import('@stacks/network'),
            ]);
            const { principalCV, uintCV, PostConditionMode, AnchorMode } = tx;
            const network = NETWORK_ENV === 'mainnet' ? net.STACKS_MAINNET : net.STACKS_TESTNET;
            const config  = getContractConfig();
            const admin   = getUserAddress();
            await doContractCall({
                network,
                contractAddress: config.deployer,
                contractName:    config.predictionMarket,
                functionName:    'initialize',
                functionArgs: [
                    principalCV(admin),  // admin
                    principalCV(admin),  // oracle
                    principalCV(admin),  // treasury
                    uintCV(10_000),      // fee: 0.01 STX
                    uintCV(20_000),      // min-bet: 0.02 STX
                    uintCV(100_000),     // max-bet: 0.1 STX
                ],
                postConditionMode: PostConditionMode.Allow,
                anchorMode: AnchorMode.Any,
                onFinish: async () => {
                    toast.success('Contract initialized!');
                    setTimeout(checkInitialized, 4000);
                    setIsInitializing(false);
                },
                onCancel: () => setIsInitializing(false),
            });
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to initialize'));
            setIsInitializing(false);
        }
    };

    useEffect(() => {
        loadData();
        fetchCurrentBlock();
        checkInitialized();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast.error('Image must be < 2 MB'); return; }
        setPreviewUrl(URL.createObjectURL(file));
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
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Upload failed'));
            setImageUrl('');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateMarket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question || !resolveDate) { toast.error('Question and date are required'); return; }
        if (!estimatedBlock) { toast.error('Block height not loaded yet — please wait'); return; }
        setIsSubmitting(true);
        try {
            const [tx, net] = await Promise.all([
                import('@stacks/transactions'),
                import('@stacks/network'),
            ]);
            const { stringAsciiCV, noneCV, someCV, uintCV, PostConditionMode, AnchorMode } = tx;
            const network = NETWORK_ENV === 'mainnet' ? net.STACKS_MAINNET : net.STACKS_TESTNET;
            const config = getContractConfig();
            const createdBy = getUserAddress();

            // Read expected market ID before signing so we can store it immediately
            const contractMarketId = await getNextMarketId();

            await doContractCall({
                network,
                contractAddress: config.deployer,
                contractName:    config.predictionMarket,
                functionName:    'create-market',
                functionArgs: [
                    stringAsciiCV(question.slice(0, 256)),
                    description ? someCV(stringAsciiCV(description.slice(0, 512))) : noneCV(),
                    uintCV(estimatedBlock),
                    imageUrl    ? someCV(stringAsciiCV(imageUrl.slice(0, 64)))    : noneCV(),
                ],
                postConditionMode: PostConditionMode.Allow,
                anchorMode: AnchorMode.Any,
                onFinish: async (data) => {
                    await createMarketRecord({
                        question, description, category, imageUrl,
                        resolveDate, resolveBlock: estimatedBlock,
                        createdBy,
                        txId: data.txId,
                        contractMarketId,
                    });
                    toast.success('Market submitted on-chain!');
                    setQuestion(''); setDescription(''); setResolveDate('');
                    setPreviewUrl(null); setImageUrl('');
                    setIsSubmitting(false);
                    setTimeout(loadData, 3000);
                },
                onCancel: () => setIsSubmitting(false),
            });
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to create market'));
            setIsSubmitting(false);
        }
    };

    const handleResolve = async (marketId: number, outcome: boolean) => {
        setProcessingId(marketId);
        try {
            const market = markets.find(m => m.id === marketId);
            if (!market?.backendId) throw new Error('Missing backend reference');
            await resolveMarketRecord(market.backendId, outcome);
            toast.success(`Market ${marketId} resolved as ${outcome ? 'YES' : 'NO'}!`);
            setTimeout(loadData, 2000);
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to resolve'));
        } finally {
            setProcessingId(null);
        }
    };

    const totalVolume = markets.reduce((sum, m) => {
        return sum + (Number(m['yes-pool']) + Number(m['no-pool'])) / 1_000_000;
    }, 0);

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <motion.aside
                    className="w-56 shrink-0 border-r border-border/60 bg-muted/20 flex flex-col"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={defaultTransition}
                >
                    <div className="p-4 border-b border-border/60">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-md bg-primary/15 flex items-center justify-center">
                                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="text-sm font-semibold">Admin Panel</span>
                        </div>
                    </div>

                    <nav className="p-3 space-y-1 flex-1">
                        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-mono transition-colors text-left ${
                                    activeTab === id
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                {label}
                                {activeTab === id && (
                                    <ChevronRight className="h-3 w-3 ml-auto text-primary" />
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Sidebar footer stats */}
                    <div className="p-3 border-t border-border/60 space-y-2">
                        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs font-mono">
                            <div className="text-muted-foreground">Active</div>
                            <div className="font-bold text-primary">{activeMarkets.length}</div>
                        </div>
                        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs font-mono">
                            <div className="text-muted-foreground">Total</div>
                            <div className="font-bold">{markets.length}</div>
                        </div>
                    </div>
                </motion.aside>

                {/* Main content */}
                <motion.div
                    className="flex-1 overflow-auto p-6 md:p-8 space-y-6"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...defaultTransition, delay: 0.08 }}
                >
                    {/* Contract initialization banner */}
                    {isInitialized === false && (
                        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1 space-y-0.5">
                                <p className="text-sm font-semibold text-yellow-500">Contract not initialized</p>
                                <p className="text-xs font-mono text-muted-foreground">
                                    Run <code className="text-yellow-500">initialize()</code> once before creating markets. Your wallet will sign the transaction.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                className="font-mono text-xs bg-yellow-500 hover:bg-yellow-600 text-black shrink-0"
                                onClick={handleInitialize}
                                disabled={isInitializing}
                            >
                                {isInitializing ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Initializing…</> : 'Initialize Contract'}
                            </Button>
                        </div>
                    )}
                    {isInitialized === true && (
                        <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-2.5 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span className="text-xs font-mono text-green-500">Contract initialized · ready to create markets</span>
                        </div>
                    )}
                    {/* ── OVERVIEW ─────────────────────────────────── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <SectionHeader
                                icon={LayoutDashboard}
                                title="Platform Overview"
                                sub="Real-time market data"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { icon: Globe,    label: 'Total Markets',  value: markets.length,        accent: false },
                                    { icon: Zap,      label: 'Active Markets', value: activeMarkets.length,  accent: true  },
                                    { icon: BarChart3, label: 'Total Volume',  value: `$${totalVolume.toFixed(2)}`, accent: false },
                                ].map(({ icon: Icon, label, value, accent }) => (
                                    <div key={label} className="rounded-xl border border-border/60 bg-card p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
                                            <Icon className={`h-3.5 w-3.5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
                                        </div>
                                        <div className={`text-2xl font-bold font-mono ${accent ? 'text-primary' : ''}`}>{value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Market list quick view */}
                            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                                <div className="px-5 py-3 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Recent Markets</span>
                                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('resolve')} className="font-mono text-xs text-primary h-7">
                                        Resolve →
                                    </Button>
                                </div>
                                <div className="divide-y divide-border/40">
                                    {markets.slice(0, 5).map(m => (
                                        <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                                            <Badge variant="outline" className={`text-[10px] font-mono shrink-0 ${
                                                m.status === 'active' || m.status === 0 || m.status === '0'
                                                    ? 'text-green-500 border-green-500/40'
                                                    : 'text-muted-foreground'
                                            }`}>
                                                {m.status === 'active' || m.status === 0 || m.status === '0' ? 'LIVE' : String(m.status).toUpperCase()}
                                            </Badge>
                                            <p className="text-sm flex-1 truncate">{m.question}</p>
                                            <span className="text-xs font-mono text-muted-foreground shrink-0">#{m.id}</span>
                                        </div>
                                    ))}
                                    {markets.length === 0 && (
                                        <div className="py-8 text-center text-sm font-mono text-muted-foreground">No markets yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── CREATE ───────────────────────────────────── */}
                    {activeTab === 'create' && (
                        <div className="space-y-6 max-w-2xl">
                            <SectionHeader
                                icon={PlusCircle}
                                title="Create New Market"
                                sub="Deploy a prediction market to the blockchain"
                            />

                            <form onSubmit={handleCreateMarket} className="space-y-5">
                                {/* Question */}
                                <Field label="Market Question" hint="Make it a clear YES/NO question">
                                    <Input
                                        placeholder="e.g. Will Bitcoin reach $100k by end of 2026?"
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        required
                                        className="font-mono text-sm"
                                    />
                                </Field>

                                {/* Category + Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Category">
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                        >
                                            <option value="Crypto">Crypto</option>
                                            <option value="Politics">Politics</option>
                                            <option value="Sports">Sports</option>
                                            <option value="General">General</option>
                                        </select>
                                    </Field>
                                    <Field
                                        label="Resolution Date"
                                        hint={
                                            blockFetching
                                                ? 'Fetching block height…'
                                                : currentBlock
                                                    ? `Tip #${currentBlock.toLocaleString()} → resolve at #${estimatedBlock ? estimatedBlock.toLocaleString() : '…'}`
                                                    : 'Could not fetch block height'
                                        }
                                    >
                                        <Input
                                            type="datetime-local"
                                            value={resolveDate}
                                            onChange={e => setResolveDate(e.target.value)}
                                            required
                                            className="font-mono text-sm"
                                        />
                                    </Field>
                                </div>

                                {/* Image upload */}
                                <Field label="Market Image" hint="Max 2 MB · uploaded to IPFS">
                                    <label className="relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-colors overflow-hidden">
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
                                                className="h-20 w-20 rounded-lg object-cover"
                                                alt="Preview"
                                            />
                                        ) : isUploading ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                                                <Upload className="h-5 w-5" />
                                                <span className="text-xs font-mono">Click to upload</span>
                                            </div>
                                        )}
                                    </label>
                                </Field>

                                {/* Description */}
                                <Field label="Resolution Criteria" hint="Markdown supported">
                                    <Textarea
                                        placeholder="Describe exactly how this market will be resolved..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="font-mono text-sm min-h-[100px]"
                                    />
                                </Field>

                                <Button
                                    type="submit"
                                    className="w-full font-mono"
                                    disabled={isSubmitting || isUploading}
                                >
                                    {isSubmitting
                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
                                        : <><PlusCircle className="mr-2 h-4 w-4" />Create Market</>
                                    }
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* ── RESOLVE ──────────────────────────────────── */}
                    {activeTab === 'resolve' && (
                        <div className="space-y-6">
                            <SectionHeader
                                icon={CheckSquare}
                                title="Resolve Markets"
                                sub={`${activeMarkets.length} active market${activeMarkets.length !== 1 ? 's' : ''} pending resolution`}
                            />

                            {activeMarkets.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border py-16 text-center space-y-2">
                                    <CheckSquare className="h-8 w-8 text-muted-foreground mx-auto" />
                                    <p className="text-sm font-mono text-muted-foreground">No active markets to resolve.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeMarkets.map(market => {
                                        const yesPool = Number(market['yes-pool']) / 1_000_000;
                                        const noPool  = Number(market['no-pool'])  / 1_000_000;
                                        const total   = yesPool + noPool;
                                        const yesPercent = total > 0 ? (yesPool / total) * 100 : 50;
                                        const noPercent  = 100 - yesPercent;
                                        const resolveDate = blockToDate(market['resolve-date']);

                                        return (
                                            <div
                                                key={market.id}
                                                className="rounded-xl border border-border/60 bg-card overflow-hidden"
                                            >
                                                <div className="px-5 py-4 border-b border-border/60">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <p className="font-semibold text-sm leading-snug flex-1">
                                                            {market.question}
                                                        </p>
                                                        <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                                                            #{market.id}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs font-mono text-muted-foreground mt-1.5">
                                                        Resolves {resolveDate.toLocaleDateString()}
                                                    </p>
                                                </div>

                                                <div className="px-5 py-4 space-y-4">
                                                    {/* Pool breakdown */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                                                            <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">YES Pool</div>
                                                            <div className="font-bold font-mono text-green-500">${yesPool.toFixed(2)}</div>
                                                            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{yesPercent.toFixed(1)}%</div>
                                                        </div>
                                                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                                                            <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">NO Pool</div>
                                                            <div className="font-bold font-mono text-red-500">${noPool.toFixed(2)}</div>
                                                            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{noPercent.toFixed(1)}%</div>
                                                        </div>
                                                    </div>

                                                    {/* Pool bar */}
                                                    <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-muted">
                                                        <div className="h-full bg-green-500" style={{ width: `${yesPercent}%` }} />
                                                        <div className="h-full bg-red-500"   style={{ width: `${noPercent}%`  }} />
                                                    </div>

                                                    {/* Resolve buttons */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Button
                                                            className="font-mono text-sm bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={() => handleResolve(market.id, true)}
                                                            disabled={processingId === market.id}
                                                        >
                                                            {processingId === market.id
                                                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                : <Gavel className="mr-2 h-4 w-4" />
                                                            }
                                                            YES Wins
                                                        </Button>
                                                        <Button
                                                            className="font-mono text-sm bg-red-600 hover:bg-red-700 text-white"
                                                            onClick={() => handleResolve(market.id, false)}
                                                            disabled={processingId === market.id}
                                                        >
                                                            {processingId === market.id
                                                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                : <Gavel className="mr-2 h-4 w-4" />
                                                            }
                                                            NO Wins
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            <Footer />
        </main>
    );
}

function SectionHeader({
    icon: Icon, title, sub,
}: { icon: React.ElementType; title: string; sub?: string }) {
    return (
        <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-mono uppercase tracking-widest">{title}</span>
            </div>
            {sub && <p className="text-xs text-muted-foreground font-mono">{sub}</p>}
        </div>
    );
}

function Field({
    label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
                <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
                    {label}
                </Label>
                {hint && <span className="text-[10px] font-mono text-muted-foreground">{hint}</span>}
            </div>
            {children}
        </div>
    );
}
