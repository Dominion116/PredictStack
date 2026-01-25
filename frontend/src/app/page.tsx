'use client';

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Trophy, Zap, Shield, Wallet, BarChart3, CheckCircle, Github, Twitter } from "lucide-react";
import { MarketsList } from "@/components/markets-list";
import { useEffect, useState } from "react";
import { getPlatformStats } from "@/lib/stacks-api";
import { userSession } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/footer";

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
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
      <section className="flex-1 py-20 md:py-32 flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium mb-6">
          🚀 Now Live on Stacks Testnet
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter sm:text-5xl mb-6 max-w-3xl">
          Decentralized Prediction Markets on <span className="text-orange-500">Stacks</span>
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl mb-8 leading-relaxed">
          Bet on future events with USDCx. Transparent, secure, and secured by Bitcoin.
          Predict the future, today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/markets">
              <Button size="lg" className="h-12 px-8 text-lg">
                Start Betting <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/bridge">
              <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                Bridge USDCx
              </Button>
            </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500">
                ${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Total Volume</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500">{totalMarkets}</div>
              <div className="text-sm text-muted-foreground mt-1">Active Markets</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500">{totalMarkets * 12}+</div>
              <div className="text-sm text-muted-foreground mt-1">Predictions Made</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500">100%</div>
              <div className="text-sm text-muted-foreground mt-1">On-Chain</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="container py-12 md:py-24">
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
      </section>

      {/* How It Works */}
      <section className="container py-12 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start predicting in three simple steps. No complex setup required.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Connect Wallet</h3>
            <p className="text-muted-foreground">
              Connect your Stacks wallet like Leather or Xverse to get started.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">2. Choose a Market</h3>
            <p className="text-muted-foreground">
              Browse markets across Crypto, Politics, Sports, and more.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Predict & Win</h3>
            <p className="text-muted-foreground">
              Place your bet, and if you&apos;re right, collect your winnings automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container py-12 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">Why PredictStack?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built on Stacks, secured by Bitcoin. The most transparent prediction market.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
              <Card className="bg-card/30 border-none shadow-none">
                  <CardHeader>
                      <Zap className="h-10 w-10 text-yellow-500 mb-4" />
                      <CardTitle>Instant Settlement</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                      Markets resolve automatically via trusted oracles, sending funds directly to your wallet.
                  </CardContent>
              </Card>
              
              <Card className="bg-card/30 border-none shadow-none">
                  <CardHeader>
                       <Trophy className="h-10 w-10 text-orange-500 mb-4" />
                      <CardTitle>USDCx Betting</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                      Use stablecoins for low volatility. Bridge your USDC from Ethereum seamlessly.
                  </CardContent>
              </Card>
              
               <Card className="bg-card/30 border-none shadow-none">
                  <CardHeader>
                      <Shield className="h-10 w-10 text-blue-500 mb-4" />
                      <CardTitle>Bitcoin Security</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                      Secured by Proof-of-Transfer. Your predictions are recorded on Stacks, anchored to Bitcoin.
                  </CardContent>
              </Card>
          </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/30">
        <div className="container py-12 md:py-20">
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
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
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
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
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
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
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
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
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
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
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
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
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
