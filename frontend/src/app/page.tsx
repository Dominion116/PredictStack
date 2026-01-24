import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Trophy, Zap, Shield, Wallet, BarChart3, CheckCircle, Github, Twitter } from "lucide-react";
import { MarketsList } from "@/components/markets-list";

export default function Home() {
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
      <section className="border-y bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500">$1M+</div>
              <div className="text-sm text-muted-foreground mt-1">Total Volume</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500">500+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Markets</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500">10K+</div>
              <div className="text-sm text-muted-foreground mt-1">Predictions Made</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500">99.9%</div>
              <div className="text-sm text-muted-foreground mt-1">Uptime</div>
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
      <section className="container py-12 md:py-24 border-t">
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
      <section className="container py-12 md:py-24 border-t">
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

      {/* Trust Section */}
      <section className="bg-muted/30 border-y">
        <div className="container py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">
                Fully On-Chain. Fully Transparent.
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Non-Custodial</div>
                    <div className="text-sm text-muted-foreground">Your funds are always in your control. We never hold your assets.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Verifiable Outcomes</div>
                    <div className="text-sm text-muted-foreground">All market resolutions are recorded on-chain and publicly auditable.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Open Source</div>
                    <div className="text-sm text-muted-foreground">Our smart contracts are open source and have been reviewed by the community.</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-2xl p-8 md:p-12 text-center">
              <div className="text-5xl font-bold text-orange-500 mb-2">100%</div>
              <div className="text-lg font-medium mb-1">On-Chain</div>
              <div className="text-sm text-muted-foreground">Every bet, every resolution, every payout — all recorded on the blockchain.</div>
            </div>
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
      <footer className="border-t bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="font-bold text-xl mb-4">PredictStack</div>
              <p className="text-sm text-muted-foreground mb-4">
                Decentralized prediction markets on Stacks, secured by Bitcoin.
              </p>
              <div className="flex gap-4">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://github.com/Dominion116/PredictStack" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <div className="font-semibold mb-4">Product</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/markets" className="hover:text-foreground transition-colors">Markets</Link></li>
                <li><Link href="/bridge" className="hover:text-foreground transition-colors">Bridge</Link></li>
                <li><Link href="/create" className="hover:text-foreground transition-colors">Create Market</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <div className="font-semibold mb-4">Resources</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <div className="font-semibold mb-4">Legal</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Risk Disclosure</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 PredictStack. All rights reserved.
            </div>
            <div className="text-sm text-muted-foreground">
              Built with ❤️ on Stacks
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}
