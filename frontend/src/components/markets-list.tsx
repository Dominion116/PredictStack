'use client';

import { useEffect, useState } from 'react';
import { getRecentMarkets } from '@/lib/stacks-api';
import { MarketCard, MarketCardSkeleton } from './market-card';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { InfoIcon, RefreshCcw, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 9;

export function MarketsList() {
    const [allMarkets, setAllMarkets] = useState<any[]>([]);
    const [filteredMarkets, setFilteredMarkets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const loadMarkets = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRecentMarkets(50);
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

        if (tab !== 'all') {
            result = result.filter(market => {
                const category = market.category || 'General';
                return category.toLowerCase() === tab.toLowerCase();
            });
        }

        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            result = result.filter(market => {
                const question = (market.question || '').toLowerCase();
                return question.includes(lowerQuery);
            });
        }

        setFilteredMarkets(result);
        setCurrentPage(1); // Reset to first page on filter change
    };

    useEffect(() => {
        loadMarkets();
    }, []);

    useEffect(() => {
        applyFilter(allMarkets, activeTab, searchQuery);
    }, [activeTab, searchQuery, allMarkets]);

    const totalPages = Math.ceil(filteredMarkets.length / ITEMS_PER_PAGE);
    const paginatedMarkets = filteredMarkets.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

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
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedMarkets.map((market, index) => (
                            <MarketCard key={market.id} market={market} index={index} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className="w-8 h-8 p-0"
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
