
'use client';

import { useEffect, useState } from 'react';
import { getRecentMarkets } from '@/lib/stacks-api';
import { MarketCard, MarketCardSkeleton } from './market-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MarketsList() {
    const [allMarkets, setAllMarkets] = useState<any[]>([]);
    const [filteredMarkets, setFilteredMarkets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('all');

    const loadMarkets = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRecentMarkets(20); // Load more to allow filtering
            setAllMarkets(data);
            applyFilter(data, activeTab);
        } catch (err) {
            console.error(err);
            setError('Failed to load markets from the Stacks blockchain.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = (data: any[], tab: string) => {
        if (tab === 'all') {
            setFilteredMarkets(data);
        } else {
            const filtered = data.filter(market => {
                const category = market.category?.value || market.category || 'General';
                return category.toLowerCase() === tab.toLowerCase();
            });
            setFilteredMarkets(filtered);
        }
    };

    useEffect(() => {
        loadMarkets();
    }, []);

    useEffect(() => {
        applyFilter(allMarkets, activeTab);
    }, [activeTab, allMarkets]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-full max-w-md bg-muted animate-pulse rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <MarketCardSkeleton key={i} />
                    ))}
                </div>
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

    return (
        <div className="space-y-8">
            <div className="flex justify-center md:justify-start">
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="crypto">Crypto</TabsTrigger>
                        <TabsTrigger value="politics">Politics</TabsTrigger>
                        <TabsTrigger value="sports">Sports</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {filteredMarkets.length === 0 ? (
                <div className="bg-muted/20 border border-dashed rounded-xl p-12 text-center">
                    <InfoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No markets found</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                        There are currently no active markets in the <strong>{activeTab}</strong> category. 
                        Check back later or explore other categories.
                    </p>
                    <Button className="mt-6" variant="outline" onClick={loadMarkets}>
                       <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMarkets.map((market) => (
                        <MarketCard key={market.id} market={market} />
                    ))}
                </div>
            )}
        </div>
    );
}
