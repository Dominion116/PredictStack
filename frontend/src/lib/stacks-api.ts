
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
    // Return from mock data if it exists
    const mock = MOCK_MARKETS.find(m => m.id === marketId);
    if (mock) return mock;

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
        return { "total-markets": { value: MOCK_MARKETS.length } };
    } catch (error) {
        return { "total-markets": { value: MOCK_MARKETS.length } };
    }
}

/**
 * Helper to get multiple markets. 
 */
export async function getRecentMarkets(limit: number = 6) {
    // Use mocks for now as requested
    return MOCK_MARKETS.slice(0, limit);
}
