
'use client';

import { Navbar } from "@/components/navbar";
import { MarketsList } from "@/components/markets-list";

export default function MarketsPage() {
    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            
            <section className="container py-12">
                <div className="space-y-2 mb-10">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Explore Markets</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Browse all active prediction markets on PredictStack. 
                        Place your bets on outcomes you believe in.
                    </p>
                </div>

                <MarketsList />
            </section>
        </main>
    );
}
