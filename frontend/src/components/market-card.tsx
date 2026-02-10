
'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { blockToDate, formatResolutionDate } from '@/lib/date-utils';

interface MarketCardProps {
    market: any;
}

export function MarketCard({ market }: MarketCardProps) {
    // Market data is now clean values from stacks-api
    const question = market.question || 'Unknown Market';
    const imageUrl = market['image-url'];
    const category = market.category || 'General';

    // Parse pool values
    const yesPool = Number(market['yes-pool']) / 1_000_000;
    const noPool = Number(market['no-pool']) / 1_000_000;
    const totalPool = yesPool + noPool;
    
    // Calculate payout multipliers (how much you get back per $1 bet if you win)
    const yesMultiplier = yesPool > 0 ? (totalPool / yesPool).toFixed(2) : '2.00';
    const noMultiplier = noPool > 0 ? (totalPool / noPool).toFixed(2) : '2.00';
    
    // Calculate implied probability for display
    const yesImpliedProb = totalPool > 0 ? ((yesPool / totalPool) * 100).toFixed(1) : '50.0';
    const noImpliedProb = totalPool > 0 ? ((noPool / totalPool) * 100).toFixed(1) : '50.0';

    // Calculate resolution date
    const resolveBlock = market['resolve-date'] || 0;
    // For mocked markets without block data, we'll default to "Active"
    // In a real app with block data, we'd use:
    const resolutionDate = resolveBlock > 0 ? blockToDate(resolveBlock) : null;
    const timeDisplay = resolutionDate ? formatResolutionDate(resolutionDate) : "Active";

    return (
        <Card className="overflow-hidden bg-card/50 backdrop-blur hover:border-primary/50 transition-all group flex flex-col">
            {/* Image/Header Section */}
            {imageUrl ? (
                <div className="relative h-40 w-full overflow-hidden">
                    <img 
                        src={imageUrl} 
                        alt={question}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 left-2">
                        <Badge className="bg-background/80 backdrop-blur-sm text-foreground">
                            {category}
                        </Badge>
                    </div>
                </div>
            ) : (
                <div className="relative h-24 w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-primary/50" />
                    <div className="absolute top-2 left-2">
                        <Badge className="bg-background/80 backdrop-blur-sm text-foreground">
                            {category}
                        </Badge>
                    </div>
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
                        {timeDisplay}
                    </span>
                </div>
                <CardTitle className="text-lg leading-tight line-clamp-2">
                    {question}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    {/* Stacks Pool Odds */}
                    <div>
                        <span className="text-xs font-medium text-muted-foreground mb-2 block">
                            Pool Distribution
                        </span>
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">YES</div>
                                <div className="text-2xl font-bold text-green-500">
                                    {yesMultiplier}x
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    ${yesPool.toFixed(2)} pool
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-sm text-muted-foreground">NO</div>
                                <div className="text-2xl font-bold text-red-500">
                                    {noMultiplier}x
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    ${noPool.toFixed(2)} pool
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress bar visual */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                        <div 
                            className="h-full bg-green-500 transition-all duration-1000" 
                            style={{ width: `${yesImpliedProb}%` }}
                        />
                         <div 
                            className="h-full bg-red-500 transition-all duration-1000" 
                            style={{ width: `${noImpliedProb}%` }}
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

