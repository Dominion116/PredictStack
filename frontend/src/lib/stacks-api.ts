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
