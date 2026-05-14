'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { defaultTransition } from '@/lib/animations';
import { Navbar } from '@/components/navbar';
import {
    confirmBet, confirmClaim, createBetIntent,
    getMarket, getStxBalance, getUserPosition,
    getQuotePrice, getQuoteShares,
} from '@/lib/stacks-api';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
    Loader2, TrendingUp, Clock, AlertCircle,
    Wallet, CheckCircle, ArrowLeft, Zap,
    BarChart2, Users, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConnect } from '@stacks/connect-react';
import { userSession, getContractConfig, isUserSignedIn } from '@/lib/constants';
import { PostConditionMode, AnchorMode, Cl, Pc } from '@stacks/transactions';
import Link from 'next/link';

const MIN_BET_STX  = 0.02;
const MAX_BET_STX  = 0.1;
const FIXED_FEE_STX = 0.01;
const QUICK_AMOUNTS = [0.02, 0.05, 0.1];

// ─── helpers ─────────────────────────────────────────────────────────────────

function resolveDisplay(market: any): string {
    const iso = market['resolve-time-iso'] ?? market.resolveTimeIso;
    if (!iso) return 'Active';
    const d = new Date(iso);
    const now = Date.now();
    const diff = d.getTime() - now;
    if (diff < 0) return `Ended ${d.toLocaleDateString()}`;
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (mins < 60)  return `Ends in ${mins}m`;
    if (hours < 24) return `Ends in ${hours}h`;
    return `Ends in ${days}d`;
}

function statusColor(status: string) {
    if (status === 'active')    return 'text-green-500 border-green-500/40';
    if (status === 'resolved')  return 'text-primary border-primary/40';
    if (status === 'cancelled') return 'text-muted-foreground border-border';
    return 'text-muted-foreground border-border';
}

function statusLabel(status: string) {
    if (status === 'active')    return 'LIVE';
    if (status === 'resolved')  return 'RESOLVED';
    if (status === 'cancelled') return 'CANCELLED';
    return status.toUpperCase();
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function PageSkeleton() {
    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <div className="container py-8 flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-5">
                        <div className="h-52 rounded-2xl bg-muted animate-pulse" />
                        <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-28 rounded-xl bg-muted animate-pulse" />
                            <div className="h-28 rounded-xl bg-muted animate-pulse" />
                        </div>
                    </div>
                    <div className="h-[480px] rounded-xl bg-muted animate-pulse" />
                </div>
            </div>
        </main>
    );
}

// ─── quote row ───────────────────────────────────────────────────────────────

function QuoteRow({ label, value, accent = false, loading = false }: {
    label: string; value: string; accent?: boolean; loading?: boolean;
}) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-xs font-mono text-muted-foreground">{label}</span>
            {loading
                ? <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                : <span className={`text-xs font-mono font-semibold ${accent ? 'text-primary' : ''}`}>{value}</span>
            }
        </div>
    );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function MarketPage() {
    const params = useParams();
    const marketId = Number(params.id);
    const { doContractCall } = useConnect();

    const [market,        setMarket]        = useState<any>(null);
    const [loading,       setLoading]       = useState(true);
    const [betAmount,     setBetAmount]     = useState('');
    const [outcome,       setOutcome]       = useState<'YES' | 'NO'>('YES');
    const [isSubmitting,  setIsSubmitting]  = useState(false);
    const [userBalance,   setUserBalance]   = useState<number | null>(null);
    const [userPosition,  setUserPosition]  = useState<any>(null);
    const [quotePrice,    setQuotePrice]    = useState<any>(null);
    const [quoteShares,   setQuoteShares]   = useState<any>(null);
    const [quotesLoading, setQuotesLoading] = useState(false);

    // ── load market ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (isNaN(marketId)) return;
        (async () => {
            try {
                const data = await getMarket(marketId);
                setMarket(data);
                if (isUserSignedIn()) {
                    const addr = userSession.loadUserData().profile.stxAddress.testnet;
                    const [bal, pos] = await Promise.all([
                        getStxBalance(addr),
                        getUserPosition(addr, marketId),
                    ]);
                    setUserBalance(bal);
                    setUserPosition(pos);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [marketId]);

    // ── live quotes ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!market || !betAmount || isNaN(Number(betAmount)) || Number(betAmount) <= 0) {
            setQuotePrice(null); setQuoteShares(null); return;
        }
        setQuotesLoading(true);
        const micro = Math.floor(Number(betAmount) * 1_000_000);
        const isYes = outcome === 'YES';
        Promise.all([
            getQuotePrice(marketId, isYes, micro),
            getQuoteShares(marketId, isYes, micro),
        ]).then(([p, s]) => { setQuotePrice(p); setQuoteShares(s); })
          .finally(() => setQuotesLoading(false));
    }, [betAmount, outcome, market, marketId]);

    // ── bet ──────────────────────────────────────────────────────────────────
    const handleBet = useCallback(async () => {
        if (!isUserSignedIn()) { toast.error('Connect your wallet first'); return; }
        const amt = Number(betAmount);
        if (!amt || isNaN(amt) || amt < MIN_BET_STX || amt > MAX_BET_STX) {
            toast.error(`Amount must be ${MIN_BET_STX}–${MAX_BET_STX} STX`); return;
        }
        setIsSubmitting(true);
        try {
            const userAddress = userSession.loadUserData().profile.stxAddress.testnet;
            const amountMicro = Math.floor(amt * 1_000_000);
            const intent = await createBetIntent({
                userAddress, contractMarketId: marketId, amountMicro, outcome: outcome === 'YES',
            });
            const postCondition = Pc.principal(userAddress)
                .willSendEq(intent.contractCall.postConditionAmountMicro).ustx();
            await doContractCall({
                contractAddress: intent.contractCall.contractAddress,
                contractName:    intent.contractCall.contractName,
                functionName:    intent.contractCall.functionName,
                functionArgs: [
                    Cl.uint(intent.contractCall.args.marketId),
                    Cl.bool(intent.contractCall.args.outcome),
                    Cl.uint(intent.contractCall.args.amountMicro),
                    Cl.uint(intent.contractCall.args.maxAcceptedPriceBps),
                ],
                postConditions: [postCondition],
                postConditionMode: PostConditionMode.Deny,
                anchorMode: AnchorMode.Any,
                onFinish: async (data) => {
                    await confirmBet({ betId: intent.betId, txId: data.txId });
                    toast.success('Bet submitted!');
                    setBetAmount('');
                    setIsSubmitting(false);
                    setTimeout(async () => {
                        const addr = userSession.loadUserData().profile.stxAddress.testnet;
                        setUserBalance(await getStxBalance(addr));
                    }, 4000);
                },
                onCancel: () => setIsSubmitting(false),
            });
        } catch (e: any) {
            toast.error(e.message || 'Failed to place bet');
            setIsSubmitting(false);
        }
    }, [betAmount, outcome, marketId, doContractCall]);

    // ── claim ────────────────────────────────────────────────────────────────
    const handleClaim = useCallback(async () => {
        if (!isUserSignedIn()) return;
        setIsSubmitting(true);
        const config = getContractConfig();
        try {
            const userAddress = userSession.loadUserData().profile.stxAddress.testnet;
            const claimType  = market.status === 'cancelled' ? 'refund' : 'winnings';
            const funcName   = claimType === 'refund' ? 'claim-refund' : 'claim-winnings';
            await doContractCall({
                contractAddress: config.deployer,
                contractName:    config.predictionMarket,
                functionName:    funcName,
                functionArgs:    [Cl.uint(marketId)],
                postConditionMode: PostConditionMode.Allow,
                anchorMode: AnchorMode.Any,
                onFinish: async (data) => {
                    await confirmClaim({ userAddress, contractMarketId: marketId, txId: data.txId, type: claimType });
                    toast.success('Claimed! Processing…');
                    setTimeout(async () => {
                        const addr = userSession.loadUserData().profile.stxAddress.testnet;
                        const [bal, pos] = await Promise.all([
                            getStxBalance(addr), getUserPosition(addr, marketId),
                        ]);
                        setUserBalance(bal); setUserPosition(pos); setIsSubmitting(false);
                    }, 5000);
                },
                onCancel: () => setIsSubmitting(false),
            });
        } catch (e: any) {
            toast.error(e.message || 'Failed to claim');
            setIsSubmitting(false);
        }
    }, [market, marketId, doContractCall]);

    // ── states ───────────────────────────────────────────────────────────────

    if (loading) return <PageSkeleton />;

    if (!market) {
        return (
            <main className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                    <h1 className="text-xl font-bold">Market not found</h1>
                    <Button asChild variant="outline" size="sm" className="font-mono text-xs">
                        <Link href="/markets"><ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to markets</Link>
                    </Button>
                </div>
                <Footer />
            </main>
        );
    }

    // ── derived values ───────────────────────────────────────────────────────

    const question   = market.question || 'Unknown Market';
    const imageUrl   = market['image-url'] ?? market.imageUrl;
    const category   = market.category   || 'General';
    const status     = market.status     || 'active';
    const isActive   = status === 'active';
    const isResolved = status === 'resolved';

    const yesPool    = Number(market['yes-pool'] ?? market.yesPoolMicro ?? 0) / 1_000_000;
    const noPool     = Number(market['no-pool']  ?? market.noPoolMicro  ?? 0) / 1_000_000;
    const totalPool  = yesPool + noPool;

    const yesPct = totalPool > 0 ? (yesPool / totalPool) * 100 : 50;
    const noPct  = 100 - yesPct;
    const yesMult = yesPool > 0 ? (totalPool / yesPool).toFixed(2) : '2.00';
    const noMult  = noPool  > 0 ? (totalPool / noPool).toFixed(2)  : '2.00';

    const timeDisplay = resolveDisplay(market);
    const totalBets   = market.totalBets ?? 0;
    const volDisplay  = totalPool >= 1000 ? `${(totalPool / 1000).toFixed(1)}k` : totalPool.toFixed(2);

    // user position derived
    const yesAmt = userPosition ? Number(userPosition['yes-amount']) / 1_000_000 : 0;
    const noAmt  = userPosition ? Number(userPosition['no-amount'])  / 1_000_000 : 0;
    const claimed = userPosition?.claimed ?? false;

    const winningOutcome = market.winningOutcome ?? market['winning-outcome'];
    const userWon = isResolved && winningOutcome !== null && winningOutcome !== undefined && (
        (winningOutcome === true  && yesAmt > 0) ||
        (winningOutcome === false && noAmt  > 0)
    );
    const canClaim = isResolved && !claimed && (yesAmt > 0 || noAmt > 0);
    const canRefund = status === 'cancelled' && !claimed && (yesAmt > 0 || noAmt > 0);

    // ── render ───────────────────────────────────────────────────────────────

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <div className="container py-8 md:py-10 flex-1">

                {/* Breadcrumb */}
                <motion.div
                    className="flex items-center gap-2 mb-6 text-xs font-mono text-muted-foreground"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={defaultTransition}
                >
                    <Link href="/markets" className="hover:text-foreground transition-colors flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" /> Markets
                    </Link>
                    <span>/</span>
                    <span>#{marketId}</span>
                    <Badge
                        variant="outline"
                        className={`ml-1 text-[10px] px-1.5 py-0 font-mono ${statusColor(status)}`}
                    >
                        {statusLabel(status)}
                    </Badge>
                    {isActive && (
                        <span className="relative flex h-1.5 w-1.5 ml-0.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                        </span>
                    )}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── LEFT: market info ─────────────────────────────── */}
                    <motion.div
                        className="lg:col-span-2 space-y-6"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={defaultTransition}
                    >
                        {/* Hero */}
                        <div className="relative rounded-2xl overflow-hidden h-48 md:h-60 bg-muted">
                            {imageUrl ? (
                                <img src={imageUrl} alt={question} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/15 via-primary/5 to-transparent flex items-center justify-center">
                                    <TrendingUp className="h-16 w-16 text-primary/20" />
                                </div>
                            )}
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                            {/* Category chip */}
                            <div className="absolute top-3 left-3">
                                <Badge
                                    variant="outline"
                                    className="text-[11px] font-mono bg-background/70 backdrop-blur border-border/60"
                                >
                                    {category}
                                </Badge>
                            </div>

                            {/* Resolved overlay */}
                            {!isActive && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                                    <div className="text-center space-y-1">
                                        <div className={`text-lg font-bold font-mono ${isResolved ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {status === 'resolved'
                                                ? `${winningOutcome ? 'YES' : 'NO'} WON`
                                                : 'CANCELLED'}
                                        </div>
                                        <div className="text-xs font-mono text-muted-foreground">
                                            {status === 'cancelled' ? 'Refunds available' : 'Market resolved'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Question */}
                        <div className="space-y-3">
                            <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
                                {question}
                            </h1>

                            {/* Stats strip */}
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{timeDisplay}
                                </span>
                                <span className="text-border">·</span>
                                <span className="flex items-center gap-1">
                                    <BarChart2 className="h-3 w-3" />${volDisplay} vol
                                </span>
                                <span className="text-border">·</span>
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />{totalBets} bets
                                </span>
                            </div>
                        </div>

                        {/* Odds cards */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'YES', pct: yesPct, mult: yesMult, color: 'green' as const },
                                { label: 'NO',  pct: noPct,  mult: noMult,  color: 'red'   as const },
                            ].map(({ label, pct, mult, color }) => (
                                <div
                                    key={label}
                                    className={`rounded-xl border p-4 space-y-2 ${
                                        color === 'green'
                                            ? 'border-green-500/20 bg-green-500/5'
                                            : 'border-red-500/20 bg-red-500/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-mono font-bold ${
                                            color === 'green' ? 'text-green-500' : 'text-red-500'
                                        }`}>{label}</span>
                                        <span className={`text-[11px] font-mono ${
                                            color === 'green' ? 'text-green-500/70' : 'text-red-500/70'
                                        }`}>{mult}x payout</span>
                                    </div>
                                    <div className={`text-3xl font-bold font-mono ${
                                        color === 'green' ? 'text-green-500' : 'text-red-500'
                                    }`}>{pct.toFixed(1)}%</div>
                                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${color === 'green' ? 'bg-green-500' : 'bg-red-500'}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Combined probability bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                                <span>YES {yesPct.toFixed(1)}%</span>
                                <span>NO {noPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full overflow-hidden flex bg-muted">
                                <motion.div
                                    className="h-full bg-green-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${yesPct}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                />
                                <motion.div
                                    className="h-full bg-red-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${noPct}%` }}
                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.05 }}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        {(market.description || market['description']) && (
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-2">
                                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                    Resolution Criteria
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {market.description || market['description']}
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* ── RIGHT: betting panel ──────────────────────────── */}
                    <motion.div
                        className="lg:col-span-1 space-y-4"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...defaultTransition, delay: 0.12 }}
                    >
                        {/* Bet panel */}
                        <div className="sticky top-24 space-y-4">
                            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                                {/* Panel header */}
                                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                                <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-3.5 w-3.5 text-primary" />
                                        <span className="text-xs font-mono uppercase tracking-widest text-primary">
                                            Place Prediction
                                        </span>
                                    </div>
                                    {userBalance !== null && (
                                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                                            <Wallet className="h-3 w-3" />
                                            {userBalance.toFixed(4)} STX
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 space-y-5">
                                    {/* YES / NO toggle */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['YES', 'NO'] as const).map(side => (
                                            <button
                                                key={side}
                                                onClick={() => setOutcome(side)}
                                                disabled={!isActive}
                                                className={`h-11 rounded-lg border font-mono font-bold text-sm transition-all duration-150 ${
                                                    outcome === side && side === 'YES'
                                                        ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20'
                                                        : outcome === side && side === 'NO'
                                                        ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                                                        : 'bg-muted/30 border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                                            >
                                                {side}
                                                <span className={`ml-1.5 text-[10px] font-normal ${
                                                    outcome === side ? 'opacity-80' : 'opacity-50'
                                                }`}>
                                                    {side === 'YES' ? yesMult : noMult}x
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Amount input */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                                Amount
                                            </label>
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                {MIN_BET_STX}–{MAX_BET_STX} STX
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                                                STX
                                            </span>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={betAmount}
                                                onChange={e => setBetAmount(e.target.value)}
                                                min={MIN_BET_STX}
                                                max={MAX_BET_STX}
                                                step="0.01"
                                                disabled={!isActive}
                                                className="pl-9 h-11 font-mono text-sm"
                                            />
                                        </div>

                                        {/* Quick amounts */}
                                        <div className="flex gap-1.5">
                                            {QUICK_AMOUNTS.map(amt => (
                                                <button
                                                    key={amt}
                                                    onClick={() => setBetAmount(String(amt))}
                                                    disabled={!isActive}
                                                    className={`flex-1 h-7 rounded-md text-[11px] font-mono border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                                        betAmount === String(amt)
                                                            ? 'border-primary/60 bg-primary/10 text-primary'
                                                            : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground'
                                                    }`}
                                                >
                                                    {amt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quote breakdown */}
                                    <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 space-y-0.5">
                                        <QuoteRow
                                            label="Current price"
                                            value={quotePrice ? `${(quotePrice.currentPriceBps / 100).toFixed(2)}%` : '--'}
                                            loading={quotesLoading}
                                        />
                                        <QuoteRow
                                            label="Post-trade price"
                                            value={quotePrice ? `${(quotePrice.postTradePriceBps / 100).toFixed(2)}%` : '--'}
                                            loading={quotesLoading}
                                        />
                                        {quotePrice && quotePrice.priceImpactBps > 50 && (
                                            <QuoteRow
                                                label="Price impact"
                                                value={`${(quotePrice.priceImpactBps / 100).toFixed(2)}%`}
                                                accent
                                            />
                                        )}
                                        <Separator className="my-2 bg-border/60" />
                                        <QuoteRow
                                            label="Projected payout"
                                            value={quoteShares ? `${quoteShares.projectedPayout.toFixed(4)} STX` : '--'}
                                            loading={quotesLoading}
                                        />
                                        <QuoteRow
                                            label="Projected profit"
                                            value={quoteShares ? `+${quoteShares.projectedProfit.toFixed(4)} STX` : '--'}
                                            accent={!!quoteShares && quoteShares.projectedProfit > 0}
                                            loading={quotesLoading}
                                        />
                                        <QuoteRow label="Platform fee" value={`${FIXED_FEE_STX} STX`} />
                                    </div>

                                    {/* CTA */}
                                    {isActive ? (
                                        <Button
                                            className={`w-full h-11 font-mono font-bold text-sm transition-colors ${
                                                outcome === 'YES'
                                                    ? 'bg-green-500 hover:bg-green-600 text-white border-0'
                                                    : 'bg-red-500 hover:bg-red-600 text-white border-0'
                                            }`}
                                            onClick={handleBet}
                                            disabled={isSubmitting || !betAmount}
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirming…</>
                                            ) : (
                                                <>Predict {outcome} <ArrowRight className="ml-2 h-3.5 w-3.5" /></>
                                            )}
                                        </Button>
                                    ) : (
                                        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-center">
                                            <p className="text-xs font-mono text-muted-foreground">
                                                {status === 'cancelled'
                                                    ? 'Market cancelled · claim your refund below'
                                                    : 'Market resolved · claim winnings below'}
                                            </p>
                                        </div>
                                    )}

                                    {!isUserSignedIn() && isActive && (
                                        <p className="text-[11px] font-mono text-muted-foreground text-center">
                                            Connect your wallet to place a prediction
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Your position */}
                            {isUserSignedIn() && userPosition && (yesAmt > 0 || noAmt > 0) && (
                                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                                    <div className="px-5 py-3.5 border-b border-border/60 flex items-center gap-2">
                                        <CheckCircle className="h-3.5 w-3.5 text-primary" />
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
                                            Your Position
                                        </span>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            {yesAmt > 0 && (
                                                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
                                                    <div className="text-[10px] font-mono text-muted-foreground mb-1">YES</div>
                                                    <div className="text-sm font-bold font-mono text-green-500">
                                                        {yesAmt.toFixed(4)} STX
                                                    </div>
                                                </div>
                                            )}
                                            {noAmt > 0 && (
                                                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
                                                    <div className="text-[10px] font-mono text-muted-foreground mb-1">NO</div>
                                                    <div className="text-sm font-bold font-mono text-red-500">
                                                        {noAmt.toFixed(4)} STX
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Result indicator */}
                                        {isResolved && (
                                            <div className={`rounded-lg border px-3 py-2 text-center text-xs font-mono ${
                                                userWon
                                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                                    : 'bg-muted/30 border-border/60 text-muted-foreground'
                                            }`}>
                                                {userWon ? '🎯 You called it right!' : 'Better luck next time'}
                                            </div>
                                        )}

                                        {/* Claim button */}
                                        {(canClaim || canRefund) && (
                                            <Button
                                                className="w-full h-10 font-mono text-sm bg-primary hover:bg-primary/90"
                                                onClick={handleClaim}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting
                                                    ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Processing…</>
                                                    : <><Wallet className="mr-2 h-3.5 w-3.5" />{canRefund ? 'Claim Refund' : 'Claim Winnings'}</>
                                                }
                                            </Button>
                                        )}

                                        {claimed && (
                                            <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-green-500">
                                                <CheckCircle className="h-3.5 w-3.5" />
                                                Already claimed
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
