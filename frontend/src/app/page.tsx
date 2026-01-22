import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Trophy, Zap, Shield } from "lucide-react";

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

      {/* Feature Grid */}
      <section className="container py-12 md:py-24 grid gap-6 md:grid-cols-3">
          <Card className="bg-card/50 backdrop-blur border-muted/60">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" /> Instant Settlement
                  </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                  Markets resolve automatically via trusted oracles, sending funds directly to your wallet without intermediaries.
              </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur border-muted/60">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                       <Trophy className="h-5 w-5 text-orange-500" /> USDCx Betting
                  </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                  Use stablecoins for low volatility betting. Bridge your USDC from Ethereum seamlessly with our integrated bridge.
              </CardContent>
          </Card>
          
           <Card className="bg-card/50 backdrop-blur border-muted/60">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-500" /> Bitcoin Security
                  </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                  Secured by Proof-of-Transfer. Your predictions are recorded on the Stacks layer, anchoring to Bitcoin.
              </CardContent>
          </Card>
      </section>
    </main>
  );
}
