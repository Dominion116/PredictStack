'use client';

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Trophy, Zap, Shield, Wallet, BarChart3 } from "lucide-react";
import { MarketsList } from "@/components/markets-list";
import { useEffect, useState } from "react";
import { getPlatformStats } from "@/lib/stacks-api";
import { isUserSignedIn } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/footer";
import Hero from "@/components/hero";
import Features from "@/components/features";

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (isUserSignedIn()) {
      router.replace('/dashboard');
    } else {
      getPlatformStats().then(setStats);
    }
  }, []);

  const totalMarkets = stats?.['total-markets']?.value || 0;
  const totalVolume = Number(stats?.['total-volume']?.value || 0) / 1000000;

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero */}
      <Hero />

      {/* Features */}
      <Features />

      {/* Featured Markets */}
      <section className="bg-muted/30">
        <div className="container py-16 md:py-24">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
              <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Trending Markets</h2>
                  <p className="text-muted-foreground">The most active predictions right now on PredictStack.</p>
              </div>
              <Link href="/markets">
                <Button variant="ghost" className="hidden md:flex">
                    View all markets <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
          </div>

          <MarketsList />
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16 md:py-24">
          <div>
            <h2 className="text-center font-semibold text-4xl tracking-tight sm:text-5xl">How it works</h2>
            <div className="mt-10 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col rounded-xl border px-5 py-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                  <Wallet className="size-5 text-orange-500" />
                </div>
                <span className="font-semibold text-lg">1. Connect & Fund</span>
                <p className="mt-1 text-[15px] text-foreground/80">
                  Connect your Stacks wallet and bridge USDC from Ethereum to get USDCx tokens for betting.
                </p>
              </div>

              <div className="flex flex-col rounded-xl border px-5 py-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                  <BarChart3 className="size-5 text-orange-500" />
                </div>
                <span className="font-semibold text-lg">2. Browse & Bet</span>
                <p className="mt-1 text-[15px] text-foreground/80">
                  Explore prediction markets, analyze odds, and place bets on outcomes you believe in.
                </p>
              </div>

              <div className="flex flex-col rounded-xl border px-5 py-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                  <Trophy className="size-5 text-orange-500" />
                </div>
                <span className="font-semibold text-lg">3. Win & Withdraw</span>
                <p className="mt-1 text-[15px] text-foreground/80">
                  When markets resolve, winnings are automatically sent to your wallet. Withdraw anytime.
                </p>
              </div>
            </div>
          </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/30">
        <div className="container py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about PredictStack.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            <details className="group bg-background rounded-lg p-6">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                What is PredictStack?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-muted-foreground mt-4">
                PredictStack is a decentralized prediction market platform built on Stacks. Users can bet on future events using USDCx tokens, with all transactions secured by Bitcoin through Stacks&apos; Proof-of-Transfer consensus.
              </p>
            </details>

            <details className="group bg-background rounded-lg p-6">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                How do I get started?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-muted-foreground mt-4">
                First, connect a Stacks wallet like Leather or Xverse. Then, bridge some USDC to get USDCx tokens. Finally, browse our markets and place your first prediction!
              </p>
            </details>

            <details className="group bg-background rounded-lg p-6">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                What is USDCx?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-muted-foreground mt-4">
                USDCx is a bridged version of USDC on the Stacks blockchain. It maintains a 1:1 peg with USDC and can be bridged back to Ethereum at any time through our bridge interface.
              </p>
            </details>

            <details className="group bg-background rounded-lg p-6">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                How are markets resolved?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-muted-foreground mt-4">
                Markets are resolved by trusted oracles after the event concludes. Once resolved, winnings are automatically distributed to the correct predictions. All resolutions are recorded on-chain for transparency.
              </p>
            </details>

            <details className="group bg-background rounded-lg p-6">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                Are my funds safe?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-muted-foreground mt-4">
                Yes! PredictStack is non-custodial, meaning your funds are held in smart contracts, not by us. All contracts are open source and secured by Bitcoin through Stacks&apos; unique architecture.
              </p>
            </details>

            <details className="group bg-background rounded-lg p-6">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                What fees does PredictStack charge?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-muted-foreground mt-4">
                We charge a small platform fee (typically 2-3%) on winning bets. This fee helps maintain the platform and oracle infrastructure. There are no fees for placing bets or withdrawing funds.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 md:py-32">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl mb-6">
            Ready to Predict the Future?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users making predictions on PredictStack. 
            Start with as little as $1 USDCx.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/markets">
              <Button size="lg" className="h-12 px-8 text-lg">
                Explore Markets <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/bridge">
              <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                Get USDCx
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
