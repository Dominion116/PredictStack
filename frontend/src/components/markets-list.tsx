
'use client';

import { useEffect, useState } from 'react';
import { getRecentMarkets } from '@/lib/stacks-api';
import { MarketCard, MarketCardSkeleton } from './market-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';

export function MarketsList() {
    const [markets, setMarkets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMarkets = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRecentMarkets(6);
            setMarkets(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load markets from the Stacks blockchain.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMarkets();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <MarketCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 space-y-4">
               <p className="text-destructive font-medium">{error}</p>
               <Button variant="outline" onClick={loadMarkets}>
                   <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
               </Button>
            </div>
        );
    }

    if (markets.length === 0) {
        return (
            <div className="bg-muted/20 border border-dashed rounded-xl p-12 text-center">
                <InfoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No markets found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                    The platform is waiting for the first markets to be seeded. 
                    Run the seeder script to populate this list.
                </p>
                <Button className="mt-6" variant="outline" onClick={loadMarkets}>
                   <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => (
                <MarketCard key={market.id} market={market} />
            ))}
        </div>
    );
}
