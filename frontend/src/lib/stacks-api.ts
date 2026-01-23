
import { 
    fetchCallReadOnlyFunction, 
    cvToJSON, 
    uintCV
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
            return json.value.value;
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
        return null;
    } catch (error) {
        console.error("Error fetching platform stats:", error);
        return null;
    }
}

/**
 * Helper to get multiple markets. 
 */
export async function getRecentMarkets(limit: number = 6) {
    const stats = await getPlatformStats();
    if (!stats) return [];
    
    // stats['total-markets'] is a uintCV result
    const totalMarketsValue = stats['total-markets']?.value;
    const totalMarkets = totalMarketsValue ? Number(totalMarketsValue) : 0;
    
    if (totalMarkets === 0) return [];

    const markets = [];
    
    // Fetch in reverse order (newest first)
    for (let i = totalMarkets; i > Math.max(0, totalMarkets - limit); i--) {
        const market = await getMarket(i);
        if (market) {
            markets.push({ id: i, ...market });
        }
    }
    
    return markets;
}
