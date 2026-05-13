'use client';

import Link from "next/link";
import { Github, Twitter, ArrowUpRight, Layers, ExternalLink } from "lucide-react";
import { NETWORK_ENV, BACKEND_BASE_URL } from "@/lib/constants";

const NAV = [
    {
        heading: "Platform",
        links: [
            { label: "Markets",     href: "/markets" },
            { label: "Dashboard",   href: "/dashboard" },
            { label: "Leaderboard", href: "/leaderboard" },
        ],
    },
    {
        heading: "Resources",
        links: [
            { label: "Documentation", href: "#" },
            { label: "FAQ",           href: "/#faq" },
            { label: "API Docs",      href: `${BACKEND_BASE_URL}/api-docs`, external: true },
        ],
    },
    {
        heading: "Community",
        links: [
            { label: "Twitter / X", href: "https://twitter.com",                            external: true },
            { label: "GitHub",      href: "https://github.com/Dominion116/PredictStack",    external: true },
        ],
    },
];

const DEPLOYER = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY";
const SHORT    = `${DEPLOYER.slice(0, 6)}…${DEPLOYER.slice(-4)}`;

export function Footer() {
    return (
        <footer className="relative mt-auto w-full border-t border-border/60 bg-card overflow-hidden">
            {/* Very subtle dot-grid background */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage:
                        "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                }}
            />

            {/* Top accent line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="container relative py-12 md:py-16">
                <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">

                    {/* ── Brand ─────────────────────────────────── */}
                    <div className="col-span-2 md:col-span-1 space-y-5">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
                                <Layers className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="font-bold text-base tracking-tight">
                                Predict<span className="text-primary">Stack</span>
                            </span>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
                            Decentralized prediction markets on Stacks, secured by Bitcoin.
                        </p>

                        {/* Network badge */}
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                                {NETWORK_ENV}
                            </span>
                        </div>

                        {/* Socials */}
                        <div className="flex gap-2">
                            {[
                                { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
                                { href: "https://github.com/Dominion116/PredictStack", icon: Github, label: "GitHub" },
                            ].map(({ href, icon: Icon, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="h-8 w-8 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* ── Nav columns ───────────────────────────── */}
                    {NAV.map(({ heading, links }) => (
                        <div key={heading} className="space-y-4">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                {heading}
                            </div>
                            <ul className="space-y-2.5">
                                {links.map(({ label, href, external }) => (
                                    <li key={label}>
                                        {external ? (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {label}
                                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                                            </a>
                                        ) : (
                                            <Link
                                                href={href}
                                                className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {label}
                                                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* ── Bottom bar ────────────────────────────────── */}
                <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground font-mono">
                        © 2026 PredictStack · All rights reserved
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-muted-foreground">
                        {/* Contract address chip */}
                        <div
                            className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1 cursor-pointer hover:border-primary/30 transition-colors"
                            title={DEPLOYER}
                            onClick={() => navigator.clipboard?.writeText(DEPLOYER)}
                        >
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">contract</span>
                            <span className="text-foreground/70">{SHORT}</span>
                        </div>

                        <span className="hidden sm:inline text-border">·</span>

                        <span>Built on <span className="text-foreground">Stacks</span> · Secured by <span className="text-foreground">Bitcoin</span></span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
