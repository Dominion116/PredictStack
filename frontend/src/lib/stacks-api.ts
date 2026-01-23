
import { 
    callReadOnlyFunction, 
    cvToJSON, 
    uintCV, 
    standardPrincipalCV 
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { getContractConfig, NETWORK_ENV } from './constants';

const config = getContractConfig();
const network = NETWORK_ENV === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

/**
 * Fetches a single market's details from the Stacks contract.
 */
export async function getMarket(marketId: number) {
    try {
        const result = await callReadOnlyFunction({
            contractAddress: config.deployer,
            contractName: config.predictionMarket,
            functionName: 'get-market',
            functionArgs: [uintCV(marketId)],
            network,
            senderAddress: config.deployer,
        });
        
        const json = cvToJSON(result);
        if (json.success && json.value) {
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
        const result = await callReadOnlyFunction({
            contractAddress: config.deployer,
            contractName: config.predictionMarket,
            functionName: 'get-platform-stats',
            functionArgs: [],
            network,
            senderAddress: config.deployer,
        });
        
        const json = cvToJSON(result);
        return json.success ? json.value : null;
    } catch (error) {
        console.error("Error fetching platform stats:", error);
        return null;
    }
}

/**
 * Helper to get multiple markets. 
 * Note: For a production app, you might want to implementation 
 * a way to fetch all active market IDs first.
 */
export async function getRecentMarkets(limit: number = 10) {
    const stats = await getPlatformStats();
    if (!stats) return [];
    
    const totalMarkets = Number(stats['total-markets'].value);
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
