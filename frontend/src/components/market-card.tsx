
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchPolymarketMetadata, PolymarketMetadata } from '@/lib/polymarket';
import { Loader2, TrendingUp, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface MarketCardProps {
    market: any;
}

export function MarketCard({ market }: MarketCardProps) {
    const [metadata, setMetadata] = useState<PolymarketMetadata | null>(null);
    const [loadingMetadata, setLoadingMetadata] = useState(false);

    const externalId = market['external-id']?.value;

    useEffect(() => {
        if (externalId) {
            setLoadingMetadata(true);
            fetchPolymarketMetadata(externalId)
                .then(data => setMetadata(data))
                .finally(() => setLoadingMetadata(false));
        }
    }, [externalId]);

    const yesPool = Number(market['yes-pool'].value) / 1000000;
    const noPool = Number(market['no-pool'].value) / 1000000;
    const totalPool = yesPool + noPool;
    
    // Calculate simple odds based on pool size
    const yesOdds = totalPool > 0 ? (yesPool / totalPool) * 100 : 50;

    return (
        <Card className="overflow-hidden bg-card/50 backdrop-blur hover:border-primary/50 transition-all group">
            {metadata?.image && (
                <div className="relative h-40 w-full overflow-hidden">
                    <img 
                        src={metadata.image} 
                        alt={market.question.value}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 left-2">
                        <Badge className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90">
                            {metadata.category}
                        </Badge>
                    </div>
                </div>
            )}
            
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                         ${totalPool.toLocaleString()} Vol
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ends soon
                    </span>
                </div>
                <CardTitle className="text-lg leading-tight line-clamp-2">
                    {market.question.value}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                         <div className="space-y-1">
                            <span className="text-sm font-medium">YES</span>
                            <div className="text-2xl font-bold text-green-500">
                                {yesOdds.toFixed(1)}%
                            </div>
                         </div>
                         <div className="text-right space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Polymarket Odds</span>
                            <div className="text-lg font-semibold opacity-50">
                                {metadata?.liveOdds ? `${(metadata.liveOdds.yes * 100).toFixed(1)}%` : '--'}
                            </div>
                         </div>
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

            <CardFooter className="bg-muted/30 pt-4">
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
        <Card className="animate-pulse">
            <div className="h-40 bg-muted" />
            <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="h-10 bg-muted rounded" />
            </CardContent>
        </Card>
    );
}
