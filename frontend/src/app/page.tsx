import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Trophy, Zap, Shield } from "lucide-react";
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
            <Link href="/create">
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

      {/* Featured Markets */}
      <section className="container py-12 md:py-24">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
              <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Trending Markets</h2>
                  <p className="text-muted-foreground">The most active predictions right now on PredictStack.</p>
              </div>
              <Button variant="ghost" className="hidden md:flex">
                  View all markets <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
          </div>

          <MarketsList />
      </section>

      {/* Feature Grid */}
      <section className="container py-12 md:py-24 border-t">
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

    </main>
  );
}
