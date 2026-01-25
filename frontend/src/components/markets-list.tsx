
'use client';

import { useEffect, useState } from 'react';
import { getRecentMarkets } from '@/lib/stacks-api';
import { MarketCard, MarketCardSkeleton } from './market-card';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { InfoIcon, RefreshCcw, Search } from 'lucide-react';

export function MarketsList() {
    const [allMarkets, setAllMarkets] = useState<any[]>([]);
    const [filteredMarkets, setFilteredMarkets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const loadMarkets = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRecentMarkets(50); // Increased limit for better searching
            setAllMarkets(data);
            applyFilter(data, activeTab, searchQuery);
        } catch (err) {
            console.error(err);
            setError('Failed to load markets from the Stacks blockchain.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = (data: any[], tab: string, query: string) => {
        let result = data;

        // 1. Filter by Tab
        if (tab !== 'all') {
            result = result.filter(market => {
                const category = market.category?.value || market.category || 'General';
                return category.toLowerCase() === tab.toLowerCase();
            });
        }

        // 2. Filter by Search Query
        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            result = result.filter(market => {
                const question = (market.question?.value || market.question || '').toLowerCase();
                return question.includes(lowerQuery);
            });
        }

        setFilteredMarkets(result);
    };

    useEffect(() => {
        loadMarkets();
    }, []);

    useEffect(() => {
        applyFilter(allMarkets, activeTab, searchQuery);
    }, [activeTab, searchQuery, allMarkets]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                     <div className="h-10 w-full max-w-md bg-muted animate-pulse rounded-lg" />
                     <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded-lg" />
                </div>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                    <TabsList className="grid w-full grid-cols-4 md:w-[400px]">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="crypto">Crypto</TabsTrigger>
                        <TabsTrigger value="politics">Politics</TabsTrigger>
                        <TabsTrigger value="sports">Sports</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative w-full md:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search markets..."
                        className="pl-9 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredMarkets.length === 0 ? (
                <div className="bg-muted/20 border border-dashed rounded-xl p-12 text-center">
                    <InfoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No markets found</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                        We couldn't find any markets matching your criteria.
                        Try adjusting your filters or search terms.
                    </p>
                    <Button className="mt-6" variant="outline" onClick={() => { setActiveTab('all'); setSearchQuery(''); }}>
                       Clear Filters
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {filteredMarkets.map((market) => (
                        <MarketCard key={market.id} market={market} />
                    ))}
                </div>
            )}
        </div>
    );
}
