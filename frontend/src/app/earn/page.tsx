'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, defaultTransition } from '@/lib/animations';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import {
    Loader2, Zap, Lock, Unlock, Bitcoin, Clock,
    BarChart2, ArrowUpRight, RefreshCcw, CircleDot,
    CheckCircle, AlertCircle,
} from 'lucide-react';
import { isUserSignedIn, getUserAddress, NETWORK_ENV } from '@/lib/constants';
import { useStacking } from '@/hooks/use-stacking';
import { poxAddressToBtcAddress } from '@stacks/stacking';

function formatSTX(microStx: bigint | number | string): string {
    const n = Number(microStx) / 1_000_000;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(2)}k`;
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatCountdown(seconds: number): string {
    if (seconds <= 0) return 'Starting soon';
    const d = Math.floor(seconds / 86_400);
    const h = Math.floor((seconds % 86_400) / 3_600);
    const m = Math.floor((seconds % 3_600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function decodePoxBtcAddress(poxAddress: { version: Uint8Array; hashbytes: Uint8Array }): string {
    try {
        const networkName = NETWORK_ENV === 'mainnet' ? 'mainnet' : 'testnet';
        return poxAddressToBtcAddress(poxAddress.version[0], poxAddress.hashbytes, networkName);
    } catch {
        return 'Unable to decode';
    }
}

export default function EarnPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return <EarnContent />;
}

function EarnContent() {
    const address = isUserSignedIn() ? getUserAddress() : null;
    const { stackerInfo, poxInfo, lockedMicroStx, secondsUntilNextCycle, loading, error } = useStacking(address);

    const isStacking = stackerInfo?.stacked === true;
    const details    = isStacking ? (stackerInfo as Extract<typeof stackerInfo, { stacked: true }>)?.details : null;

    const minThresholdSTX   = poxInfo ? Number(poxInfo.min_amount_ustx) / 1_000_000 : null;
    const currentCycle      = poxInfo?.current_cycle?.id ?? null;
    const totalStacked      = poxInfo?.current_cycle?.stacked_ustx ?? null;
    const isPoxActive       = poxInfo?.current_cycle?.is_pox_active ?? false;

    return (
        <main id="main-content" className="min-h-screen flex flex-col bg-background">
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
                <div className="container relative py-10 md:py-14">
                    <motion.div variants={fadeInUp} initial="initial" animate="animate">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[11px] font-mono tracking-widest text-primary uppercase">
                                Proof of Transfer
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Earn BTC Rewards</h1>
                        <p className="text-muted-foreground mt-1 max-w-xl">
                            Lock STX tokens in PoX to earn Bitcoin rewards each cycle.
                            Your wallet handles the transaction — connect to see your status.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container py-10 flex-1 space-y-8">

                {/* Global PoX stats */}
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={staggerContainer}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {[
                        {
                            label: 'Current Cycle',
                            value: loading ? '—' : (currentCycle !== null ? `#${currentCycle}` : '—'),
                            icon: CircleDot,
                            accent: false,
                        },
                        {
                            label: 'Next Cycle In',
                            value: loading ? '—' : (secondsUntilNextCycle !== null ? formatCountdown(secondsUntilNextCycle) : '—'),
                            icon: Clock,
                            accent: true,
                        },
                        {
                            label: 'Total Stacked',
                            value: loading ? '—' : (totalStacked !== null ? `${formatSTX(totalStacked)} STX` : '—'),
                            icon: BarChart2,
                            accent: false,
                        },
                        {
                            label: 'Min to Stack',
                            value: loading ? '—' : (minThresholdSTX !== null ? `${minThresholdSTX.toLocaleString()} STX` : '—'),
                            icon: Lock,
                            accent: false,
                        },
                    ].map(({ label, value, icon: Icon, accent }) => (
                        <motion.div key={label} variants={fadeInUp}>
                            <div className="relative rounded-xl border border-border/60 bg-card p-5 overflow-hidden group hover:border-primary/30 transition-colors duration-300">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
                                        {label}
                                    </span>
                                    <Icon className={`h-4 w-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden="true" />
                                </div>
                                <div className={`text-2xl font-bold font-mono ${accent ? 'text-primary' : ''}`}>
                                    {loading ? <span className="inline-block h-7 w-24 bg-muted animate-pulse rounded" /> : value}
                                </div>
                                <div className="absolute bottom-0 right-0 w-16 h-16 rounded-tl-3xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* PoX status badge */}
                {!loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={defaultTransition}
                        className="flex items-center gap-2"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${isPoxActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPoxActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                            PoX is <span className={isPoxActive ? 'text-green-500' : 'text-foreground'}>{isPoxActive ? 'active' : 'inactive'}</span> this cycle
                            {NETWORK_ENV !== 'mainnet' && (
                                <span className="ml-2 text-primary">· {NETWORK_ENV}</span>
                            )}
                        </span>
                    </motion.div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive font-mono">
                        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Personal stacking status */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...defaultTransition, delay: 0.15 }}
                        className="rounded-xl border border-border/60 bg-card overflow-hidden"
                    >
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CircleDot className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                                <span className="text-xs font-mono uppercase tracking-widest text-primary">
                                    Your Stacking Status
                                </span>
                            </div>
                            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label="Loading" />}
                        </div>

                        <div className="p-5">
                            {!address ? (
                                <div className="text-center py-8 space-y-3">
                                    <Lock className="h-8 w-8 text-muted-foreground/40 mx-auto" aria-hidden="true" />
                                    <p className="text-sm text-muted-foreground font-mono">
                                        Connect your wallet to view stacking status
                                    </p>
                                </div>
                            ) : loading ? (
                                <div className="space-y-3">
                                    {[80, 60, 72, 48].map(w => (
                                        <div key={w} className="h-4 bg-muted animate-pulse rounded" style={{ width: `${w}%` }} />
                                    ))}
                                </div>
                            ) : isStacking && details ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                                        <span className="text-sm font-semibold text-green-500">Currently Stacking</span>
                                    </div>

                                    <div className="space-y-0 divide-y divide-border/40">
                                        {[
                                            { label: 'Locked Amount',      value: lockedMicroStx !== null ? `${formatSTX(lockedMicroStx)} STX` : '—', icon: Lock },
                                            { label: 'Unlock Block',       value: `#${details.unlock_height.toLocaleString()}`, icon: Unlock },
                                            { label: 'Lock Period',        value: `${details.lock_period} cycle${details.lock_period !== 1 ? 's' : ''}`, icon: Clock },
                                            { label: 'First Reward Cycle', value: `#${details.first_reward_cycle}`, icon: CircleDot },
                                            { label: 'BTC Reward Address', value: decodePoxBtcAddress(details.pox_address), icon: Bitcoin, mono: true, truncate: true },
                                        ].map(({ label, value, icon: Icon, mono, truncate }) => (
                                            <div key={label} className="flex items-center justify-between py-2.5">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                                    {label}
                                                </div>
                                                <span
                                                    className={`text-sm font-semibold ${mono ? 'font-mono' : ''} ${truncate ? 'max-w-[160px] truncate' : ''}`}
                                                    title={value}
                                                >
                                                    {value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 space-y-3">
                                    <Unlock className="h-8 w-8 text-muted-foreground/40 mx-auto" aria-hidden="true" />
                                    <p className="text-sm font-semibold">Not currently stacking</p>
                                    <p className="text-xs text-muted-foreground font-mono max-w-xs mx-auto">
                                        Lock at least {minThresholdSTX?.toLocaleString() ?? '—'} STX for one or more cycles
                                        to earn BTC rewards.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* How it works + CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...defaultTransition, delay: 0.25 }}
                        className="space-y-4"
                    >
                        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                How It Works
                            </div>
                            {[
                                { step: '01', title: 'Lock STX',  desc: `Stack at least ${minThresholdSTX?.toLocaleString() ?? '—'} STX in your wallet for 1–12 cycles.` },
                                { step: '02', title: 'Earn BTC',  desc: 'Miners transfer BTC to stackers each cycle (~2 weeks) as part of Proof of Transfer.' },
                                { step: '03', title: 'Unlock',    desc: 'Your STX unlocks automatically after your chosen lock period ends — no manual action needed.' },
                            ].map(({ step, title, desc }) => (
                                <div key={step} className="flex gap-3">
                                    <span className="text-[11px] font-mono text-primary/60 shrink-0 w-5 pt-0.5">{step}</span>
                                    <div>
                                        <p className="text-sm font-semibold">{title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                Stack via your wallet
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Stacking transactions are signed through your Stacks wallet. Use Leather or Xverse to
                                initiate stacking with full control over your keys.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                <Button asChild className="flex-1 font-mono text-sm rounded-lg" size="sm">
                                    <a href="https://leather.io" target="_blank" rel="noopener noreferrer" aria-label="Open Leather wallet (opens in new tab)">
                                        Leather Wallet
                                        <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                    </a>
                                </Button>
                                <Button asChild variant="outline" className="flex-1 font-mono text-sm rounded-lg" size="sm">
                                    <a href="https://www.xverse.app" target="_blank" rel="noopener noreferrer" aria-label="Open Xverse wallet (opens in new tab)">
                                        Xverse Wallet
                                        <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                    </a>
                                </Button>
                            </div>
                        </div>

                        {address && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="font-mono text-xs text-muted-foreground w-full"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCcw className="mr-1.5 h-3 w-3" aria-hidden="true" />
                                Refresh stacking data
                            </Button>
                        )}
                    </motion.div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
