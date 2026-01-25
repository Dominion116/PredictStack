'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getContractEvents } from '@/lib/stacks-api';
import { Loader2, TrendingUp, Trophy, Gavel, DollarSign, RefreshCcw } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/date-utils';

interface ActivityEvent {
    event_type: string;
    tx_id: string;
    block_height: number;
    timestamp: number;
    data: any;
}

function getEventIcon(eventType: string) {
    switch (eventType) {
        case 'market-created':
            return <Gavel className="h-4 w-4 text-blue-500" />;
        case 'bet-placed':
            return <TrendingUp className="h-4 w-4 text-orange-500" />;
        case 'market-resolved':
            return <Trophy className="h-4 w-4 text-green-500" />;
        case 'winnings-claimed':
            return <DollarSign className="h-4 w-4 text-green-500" />;
        default:
            return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
    }
}

function getEventLabel(eventType: string) {
    switch (eventType) {
        case 'market-created':
            return 'New Market';
        case 'bet-placed':
            return 'Bet Placed';
        case 'market-resolved':
            return 'Market Resolved';
        case 'winnings-claimed':
            return 'Winnings Claimed';
        case 'refund-claimed':
            return 'Refund Claimed';
        default:
            return 'Activity';
    }
}

export function RecentActivity() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const data = await getContractEvents(10);
            setEvents(data);
        } catch (error) {
            console.error("Failed to load events:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
        // Refresh every 30 seconds
        const interval = setInterval(loadEvents, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <button 
                    onClick={loadEvents} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                >
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </CardHeader>
            <CardContent>
                {loading && events.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No recent activity</p>
                        <p className="text-sm mt-1">Events will appear as they happen on-chain</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {events.map((event, index) => (
                            <div 
                                key={`${event.tx_id}-${index}`} 
                                className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                            >
                                <div className="mt-0.5">
                                    {getEventIcon(event.event_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">
                                            {getEventLabel(event.event_type)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                        Block #{event.block_height}
                                    </p>
                                </div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(event.timestamp))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
