
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchPolymarketMetadata, PolymarketMetadata } from '@/lib/polymarket';
import { Loader2, TrendingUp, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface MarketCardProps {
    market: any;
}

export function MarketCard({ market }: MarketCardProps) {
    const [metadata, setMetadata] = useState<PolymarketMetadata | null>(null);
    const [loadingMetadata, setLoadingMetadata] = useState(false);
    const [metadataError, setMetadataError] = useState(false);

    // Try to get external-id from the market data structure
    const externalId = market['external-id']?.value;
    const question = market.question?.value || market.question || 'Unknown Market';

    useEffect(() => {
        if (externalId) {
            setLoadingMetadata(true);
            setMetadataError(false);
            fetchPolymarketMetadata(externalId)
                .then(data => {
                    setMetadata(data);
                    if (!data) setMetadataError(true);
                })
                .catch(() => setMetadataError(true))
                .finally(() => setLoadingMetadata(false));
        }
    }, [externalId]);

    // Parse pool values safely
    const yesPoolRaw = market['yes-pool']?.value || market['yes-pool'] || 0;
    const noPoolRaw = market['no-pool']?.value || market['no-pool'] || 0;
    const yesPool = Number(yesPoolRaw) / 1_000_000;
    const noPool = Number(noPoolRaw) / 1_000_000;
    const totalPool = yesPool + noPool;
    
    // Calculate simple odds based on pool size (50/50 if empty)
    const yesOdds = totalPool > 0 ? (yesPool / totalPool) * 100 : 50;

    // Polymarket odds (converted to percentage)
    const polymarketYesOdds = metadata?.liveOdds?.yes 
        ? (metadata.liveOdds.yes * 100).toFixed(1) 
        : null;

    return (
        <Card className="overflow-hidden bg-card/50 backdrop-blur hover:border-primary/50 transition-all group flex flex-col">
            {/* Image Section */}
            {loadingMetadata ? (
                <div className="h-40 w-full bg-muted flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : metadata?.image ? (
                <div className="relative h-40 w-full overflow-hidden">
                    <img 
                        src={metadata.image} 
                        alt={question}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                            // Hide image on error
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <div className="absolute top-2 left-2">
                        <Badge className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90">
                            {metadata.category}
                        </Badge>
                    </div>
                </div>
            ) : (
                <div className="h-24 w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-primary/50" />
                </div>
            )}
            
            <CardHeader className="space-y-1 flex-grow">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        ${totalPool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Vol
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Active
                    </span>
                </div>
                <CardTitle className="text-lg leading-tight line-clamp-2">
                    {question}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                         <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Stacks Odds</span>
                            <div className="text-2xl font-bold text-green-500">
                                {yesOdds.toFixed(1)}% YES
                            </div>
                         </div>
                         {externalId && (
                             <div className="text-right space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1 justify-end">
                                    Polymarket <ExternalLink className="h-3 w-3" />
                                </span>
                                <div className="text-lg font-semibold text-blue-500">
                                    {polymarketYesOdds ? `${polymarketYesOdds}%` : '--'}
                                </div>
                             </div>
                         )}
                    </div>
                    
                    {/* Progress bar visual */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                        <div 
                            className="h-full bg-green-500 transition-all duration-1000" 
                            style={{ width: `${yesOdds}%` }}
                        />
                         <div 
                            className="h-full bg-red-500 transition-all duration-1000" 
                            style={{ width: `${100 - yesOdds}%` }}
                        />
                    </div>
                </div>
            </CardContent>

            <CardFooter className="bg-muted/30 pt-4 mt-auto">
                <Link href={`/market/${market.id}`} className="w-full">
                    <Button className="w-full group-hover:bg-primary/90">
                        Trade Market
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}

export function MarketCardSkeleton() {
    return (
        <Card className="animate-pulse flex flex-col">
            <div className="h-40 bg-muted" />
            <CardHeader>
                <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                <div className="h-6 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
                <div className="flex justify-between">
                    <div className="h-10 bg-muted rounded w-1/3" />
                    <div className="h-10 bg-muted rounded w-1/4" />
                </div>
                <div className="h-2 bg-muted rounded mt-4" />
            </CardContent>
            <CardFooter className="mt-auto">
                <div className="h-10 bg-muted rounded w-full" />
            </CardFooter>
        </Card>
    );
}

