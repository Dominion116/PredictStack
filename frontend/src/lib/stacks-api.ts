import { 
    fetchCallReadOnlyFunction, 
    cvToJSON, 
    uintCV,
    principalCV
} from '@stacks/transactions';
import { 
    STACKS_TESTNET,
    STACKS_MAINNET,
    createNetwork
} from '@stacks/network';
import { getContractConfig, NETWORK_ENV } from './constants';

const config = getContractConfig();
const network = createNetwork(NETWORK_ENV === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET);

// --- MOCK DATA ---
const MOCK_MARKETS = [
    {
        id: 1,
        question: "Will Bitcoin reach $100,000 before the end of 2024?",
        "image-url": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=1000&auto=format&fit=crop",
        category: "Crypto",
        "yes-pool": 750000000, // $750.00
        "no-pool": 250000000,  // $250.00
        status: "active",
        totalPool: 1000.00
    },
    {
        id: 2,
        question: "Will the next US President be a Democrat?",
        "image-url": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1000&auto=format&fit=crop",
        category: "Politics",
        "yes-pool": 450000000,
        "no-pool": 550000000,
        status: "active",
        totalPool: 1000.00
    },
    {
        id: 3,
        question: "Will Manchester City win the Premier League title?",
        "image-url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop",
        category: "Sports",
        "yes-pool": 800000000,
        "no-pool": 200000000,
        status: "active",
        totalPool: 1000.00
    },
    {
        id: 4,
        question: "Will Ethereum 2.0 outperform Bitcoin in 2024?",
        "image-url": "https://images.unsplash.com/photo-1622790698141-94e30457ef12?q=80&w=1000&auto=format&fit=crop",
        category: "Crypto",
        "yes-pool": 300000000,
        "no-pool": 700000000,
        status: "active",
        totalPool: 1000.00
    },
    {
        id: 5,
        question: "Will more than 3 countries adopt BTC as legal tender by 2025?",
        "image-url": "https://images.unsplash.com/photo-1639710339851-fe462983c267?q=80&w=1000&auto=format&fit=crop",
        category: "Crypto",
        "yes-pool": 150000000,
        "no-pool": 850000000,
        status: "active",
        totalPool: 1000.00
    },
    {
        id: 6,
        question: "Will the LA Lakers win the NBA Championship?",
        "image-url": "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop",
        category: "Sports",
        "yes-pool": 200000000,
        "no-pool": 800000000,
        status: "active",
        totalPool: 1000.00
    }
];

/**
 * Fetches a single market's details from the Stacks contract.
 */
export async function getMarket(marketId: number) {
    try {
        const response = await fetchCallReadOnlyFunction({
            contractAddress: config.deployer,
            contractName: config.predictionMarket,
            functionName: 'get-market',
            functionArgs: [uintCV(marketId)],
            network,
            senderAddress: config.deployer,
        });
        
        const json: any = cvToJSON(response);
        if (json.success && json.value && json.value.value) {
            // Merge with mock metadata if it exists (for images/descriptions if not in contract)
            const marketData = json.value.value;
            const mock = MOCK_MARKETS.find(m => m.id === marketId);
            if (mock) {
                return { 
                    ...marketData, 
                    "image-url": marketData["image-url"]?.value || mock["image-url"],
                    category: marketData.category?.value || mock.category
                };
            }
            return marketData;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching market ${marketId}:`, error);
        return null;
    }
}

/**
 * Fetches platform stats (total markets, etc.)
 */
export async function getPlatformStats() {
    try {
        const response = await fetchCallReadOnlyFunction({
            contractAddress: config.deployer,
            contractName: config.predictionMarket,
            functionName: 'get-platform-stats',
            functionArgs: [],
            network,
            senderAddress: config.deployer,
        });
        
        const json: any = cvToJSON(response);
        if (json.success && json.value) {
            return json.value.value;
        }
        return { "total-markets": { value: 0 } };
    } catch (error) {
        return { "total-markets": { value: 0 } };
    }
}

/**
 * Fetches recent markets from the contract.
 */
export async function getRecentMarkets(limit: number = 6) {
    try {
        const stats = await getPlatformStats();
        const totalMarkets = stats["total-markets"]?.value || 0;
        
        if (totalMarkets === 0) return MOCK_MARKETS.slice(0, limit);

        const markets = [];
        const startId = Math.max(1, totalMarkets - limit + 1);
        
        for (let id = totalMarkets; id >= startId; id--) {
            const market = await getMarket(id);
            if (market) markets.push({ ...market, id });
        }
        
        return markets;
    } catch (error) {
        console.error("Error fetching recent markets:", error);
        return MOCK_MARKETS.slice(0, limit);
    }
}

/**
 * Fetches the user's USDCx balance.
 */
export async function getUSDCxBalance(address: string) {
    try {
        const [tokenAddr, tokenName] = config.usdcx.split('.');
        const response = await fetchCallReadOnlyFunction({
            contractAddress: tokenAddr,
            contractName: tokenName,
            functionName: 'get-balance',
            functionArgs: [principalCV(address)],
            network,
            senderAddress: address,
        });

        const json: any = cvToJSON(response);
        if (json.success && json.value) {
            // SIP-010 get-balance returns (response uint uint)
            return Number(json.value.value) / 1000000;
        }
        return 0;
    } catch (error) {
        console.error("Error fetching balance:", error);
        return 0;
    }
}

/**
 * Fetches the user's position in a specific market.
 */
export async function getUserPosition(address: string, marketId: number) {
    try {
        const response = await fetchCallReadOnlyFunction({
            contractAddress: config.deployer,
            contractName: config.predictionMarket,
            functionName: 'get-user-position',
            functionArgs: [principalCV(address), uintCV(marketId)],
            network,
            senderAddress: address,
        });

        const json: any = cvToJSON(response);
        if (json.success && json.value && json.value.value) {
            return json.value.value;
        }
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Fetches the list of market IDs a user has participated in.
 */
export async function getUserMarkets(address: string) {
    try {
        const response = await fetchCallReadOnlyFunction({
            contractAddress: config.deployer,
            contractName: config.predictionMarket,
            functionName: 'get-user-markets',
            functionArgs: [principalCV(address)],
            network,
            senderAddress: address,
        });

        const json: any = cvToJSON(response);
        if (json.success && json.value && json.value.value) {
            // value is a list of uints
            return json.value.value.map((val: any) => Number(val.value));
        }
        return [];
    } catch (error) {
        console.error("Error fetching user markets:", error);
        return [];
    }
}

// -----------------------------------
// CONTRACT EVENTS (Recent Activity)
// -----------------------------------

interface ContractEvent {
    event_type: string;
    tx_id: string;
    block_height: number;
    timestamp: number;
    data: any;
}

/**
 * Fetches recent contract events from the Stacks API.
 * Used for "Recent Activity" feed on the dashboard.
 */
export async function getContractEvents(limit: number = 20): Promise<ContractEvent[]> {
    try {
        const apiUrl = NETWORK_ENV === 'mainnet' 
            ? 'https://api.mainnet.hiro.so' 
            : 'https://api.testnet.hiro.so';
        
        const contractId = `${config.deployer}.${config.predictionMarket}`;
        const url = `${apiUrl}/extended/v1/contract/${contractId}/events?limit=${limit}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        const data = await response.json();
        const events: ContractEvent[] = [];
        
        for (const event of data.results || []) {
            if (event.event_type === 'smart_contract_log') {
                try {
                    // Parse the contract log data
                    const logData = event.contract_log?.value?.repr;
                    if (logData) {
                        // Extract event type from the log
                        let eventType = 'unknown';
                        if (logData.includes('market-created')) eventType = 'market-created';
                        else if (logData.includes('bet-placed')) eventType = 'bet-placed';
                        else if (logData.includes('market-resolved')) eventType = 'market-resolved';
                        else if (logData.includes('winnings-claimed')) eventType = 'winnings-claimed';
                        else if (logData.includes('refund-claimed')) eventType = 'refund-claimed';
                        
                        events.push({
                            event_type: eventType,
                            tx_id: event.tx_id,
                            block_height: event.block_height,
                            timestamp: new Date(event.block_time_iso || Date.now()).getTime(),
                            data: event.contract_log?.value
                        });
                    }
                } catch (parseError) {
                    // Skip unparseable events
                }
            }
        }
        
        return events;
    } catch (error) {
        console.error("Error fetching contract events:", error);
        return [];
    }
}

// -----------------------------------
// LEADERBOARD DATA
// -----------------------------------

interface LeaderboardEntry {
    address: string;
    totalProfit: number;
    winRate: number;
    totalBets: number;
    rank: number;
}

/**
 * Fetches leaderboard data by analyzing contract events.
 * This aggregates bet-placed and winnings-claimed events to calculate profits.
 */
export async function getLeaderboardData(limit: number = 15): Promise<LeaderboardEntry[]> {
    try {
        const apiUrl = NETWORK_ENV === 'mainnet' 
            ? 'https://api.mainnet.hiro.so' 
            : 'https://api.testnet.hiro.so';
        
        const contractId = `${config.deployer}.${config.predictionMarket}`;
        
        // Fetch a larger set of events to aggregate
        const url = `${apiUrl}/extended/v1/contract/${contractId}/events?limit=500`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Aggregate user stats
        const userStats: Map<string, { bets: number, wins: number, totalBet: number, totalWon: number }> = new Map();
        
        for (const event of data.results || []) {
            if (event.event_type === 'smart_contract_log') {
                const logRepr = event.contract_log?.value?.repr || '';
                
                // Parse bet-placed events
                if (logRepr.includes('bet-placed')) {
                    const userMatch = logRepr.match(/user\s+([A-Z0-9]+)/i);
                    const amountMatch = logRepr.match(/amount\s+u(\d+)/);
                    
                    if (userMatch && amountMatch) {
                        const user = userMatch[1];
                        const amount = parseInt(amountMatch[1]) / 1000000;
                        
                        const existing = userStats.get(user) || { bets: 0, wins: 0, totalBet: 0, totalWon: 0 };
                        existing.bets += 1;
                        existing.totalBet += amount;
                        userStats.set(user, existing);
                    }
                }
                
                // Parse winnings-claimed events
                if (logRepr.includes('winnings-claimed')) {
                    const userMatch = logRepr.match(/user\s+([A-Z0-9]+)/i);
                    const payoutMatch = logRepr.match(/total-payout\s+u(\d+)/);
                    
                    if (userMatch && payoutMatch) {
                        const user = userMatch[1];
                        const payout = parseInt(payoutMatch[1]) / 1000000;
                        
                        const existing = userStats.get(user) || { bets: 0, wins: 0, totalBet: 0, totalWon: 0 };
                        existing.wins += 1;
                        existing.totalWon += payout;
                        userStats.set(user, existing);
                    }
                }
            }
        }
        
        // Convert to leaderboard entries
        const leaderboard: LeaderboardEntry[] = [];
        
        userStats.forEach((stats, address) => {
            const profit = stats.totalWon - stats.totalBet;
            const winRate = stats.bets > 0 ? (stats.wins / stats.bets) * 100 : 0;
            
            leaderboard.push({
                address: `${address.slice(0, 6)}...${address.slice(-4)}`,
                totalProfit: Math.round(profit * 100) / 100,
                winRate: Math.round(winRate * 10) / 10,
                totalBets: stats.bets,
                rank: 0 // Will be assigned after sorting
            });
        });
        
        // Sort by profit descending
        leaderboard.sort((a, b) => b.totalProfit - a.totalProfit);
        
        // Assign ranks and limit
        return leaderboard.slice(0, limit).map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));
        
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        return [];
    }
}
