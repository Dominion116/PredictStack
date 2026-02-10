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

/**
 * Helper function to extract actual values from Clarity value objects,
 * handling optional types and nested structures.
 */
function extractValue(clarityValue: any): any {
    if (!clarityValue) return null;
    if (typeof clarityValue !== 'object') return clarityValue;
    
    // If it has a 'value' property and a 'type' property, it's a Clarity value object
    if ('value' in clarityValue && 'type' in clarityValue) {
        // For none/null optional
        if (clarityValue.type === 'none') {
            return null;
        }
        // Recursively extract the value
        return extractValue(clarityValue.value);
    }
    
    return clarityValue;
}

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
        console.log('[DEBUG] getMarket raw response:', JSON.stringify(json, null, 2));
        if (json.success && json.value && json.value.value) {
            const marketData = json.value.value;
            // Extract actual values from Clarity value objects
            const resolved = extractValue(marketData.resolved) || false;
            const cancelled = extractValue(marketData.cancelled) || false;
            
            // Determine status
            let status = 'active';
            if (cancelled) status = 'cancelled';
            else if (resolved) status = 'resolved';
            
            const result = { 
                id: marketId,
                question: extractValue(marketData.question) || '',
                description: extractValue(marketData.description) || '',
                'resolve-date': Number(extractValue(marketData['resolve-date']) || 0),
                'yes-pool': Number(extractValue(marketData['yes-pool']) || 0),
                'no-pool': Number(extractValue(marketData['no-pool']) || 0),
                resolved,
                outcome: extractValue(marketData.outcome) || false,
                cancelled,
                status,
                creator: extractValue(marketData.creator) || '',
                'ipfs-hash': extractValue(marketData['ipfs-hash']) || null,
                category: extractValue(marketData.category) || 'General',
                'image-url': extractValue(marketData['image-url']) || null
            };
            console.log('[DEBUG] getMarket extracted result:', JSON.stringify(result, null, 2));
            return result;
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
            const stats = json.value.value;
            return {
                'total-markets': Number(extractValue(stats['total-markets']) || 0),
                'total-volume': Number(extractValue(stats['total-volume']) || 0)
            };
        }
        return { 'total-markets': 0, 'total-volume': 0 };
    } catch (error) {
        return { 'total-markets': 0, 'total-volume': 0 };
    }
}

/**
 * Fetches recent markets from the contract.
 */
export async function getRecentMarkets(limit: number = 6) {
    try {
        const stats = await getPlatformStats();
        const totalMarkets = stats["total-markets"] || 0;
        
        if (totalMarkets === 0) return [];

        const markets = [];
        const startId = Math.max(1, totalMarkets - limit + 1);
        
        for (let id = totalMarkets; id >= startId; id--) {
            const market = await getMarket(id);
            if (market) markets.push({ ...market, id });
        }
        
        return markets;
    } catch (error) {
        console.error("Error fetching recent markets:", error);
        return [];
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
            return Number(extractValue(json.value)) / 1000000;
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
            const position = json.value.value;
            // Extract actual values from Clarity value objects
            return {
                'yes-amount': Number(extractValue(position['yes-amount']) || 0),
                'no-amount': Number(extractValue(position['no-amount']) || 0),
                claimed: extractValue(position.claimed) || false
            };
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
            return json.value.value.map((val: any) => Number(extractValue(val)));
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
