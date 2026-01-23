
import axios from 'axios';
import { 
  makeContractCall, 
  Cl, 
  broadcastTransaction, 
  AnchorMode,
  noneCV,
  someCV,
  stringAsciiCV,
  uintCV,
  contractPrincipalCV
} from '@stacks/transactions';
import network from '@stacks/network';
const { StacksTestnet, StacksMainnet } = network as any;
import 'dotenv/config';

// Constants
const POLYMARKET_API_URL = 'https://clob.polymarket.com/markets';
const PREDICTION_MARKET_CONTRACT = {
    testnet: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.prediction-market',
    mainnet: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.prediction-market'
};
const TOKEN_CONTRACT = {
    testnet: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx',
    mainnet: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx'
};

// Configuration
const NETWORK_ENV = process.env.NETWORK || 'testnet';
const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY!;
const DRY_RUN = process.argv.includes('--dry-run');

if (!PRIVATE_KEY && !DRY_RUN) {
    console.error('Error: STACKS_PRIVATE_KEY not found in .env');
    process.exit(1);
}

// Helpers
const getNetwork = () => NETWORK_ENV === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

// Block time estimation (Testnet Nakamoto ~5s, Mainnet ~10m)
// We need to convert End Date (Timestamp) -> Block Height
const AVERAGE_BLOCK_TIME_SECONDS = NETWORK_ENV === 'testnet' ? 5 : 600;

async function getCurrentBlockHeight() {
    const response = await axios.get(`https://api.${NETWORK_ENV}.hiro.so/v2/info`);
    return response.data.stacks_tip_height;
}

function calculateResolveBlockHeight(endDateIso: string, currentBlockHeight: number): number {
    const now = Date.now();
    const end = new Date(endDateIso).getTime();
    const diffSeconds = (end - now) / 1000;
    
    if (diffSeconds <= 0) return currentBlockHeight + 10; // Expiring soon/now
    
    const blocksToAdd = Math.ceil(diffSeconds / AVERAGE_BLOCK_TIME_SECONDS);
    return currentBlockHeight + blocksToAdd;
}

interface PolymarketMarket {
    condition_id: string;
    question: string;
    description: string;
    end_date_iso: string;
    active: boolean;
    volume_24h: number;
    tokens: any[]; // Outcomes
}

async function fetchPolymarketData() {
    console.log('🔍 Fetching top markets from Polymarket...');
    try {
        // Fetch curated markets (using simplified endpoint or custom filter logic)
        // Note: The public CLOB API returns a lot of data. We fetch a subset.
        // For simplicity in this script, we fetch a list and filter locally.
        const response = await axios.get(POLYMARKET_API_URL);
        const markets: PolymarketMarket[] = response.data.data || [];
        
        // Filter: Active, Binary (2 tokens), Volume > 1000
        return markets.filter(m => 
            m.active && 
            m.tokens?.length === 2 && // Yes/No
            (Number(m.volume_24h) > 0 || true) // Relaxed for testing
        ).slice(0, 5); // Take top 5 for now
    } catch (error) {
        console.error('Failed to fetch from Polymarket:', error);
        return [];
    }
}

async function createStacksMarket(market: PolymarketMarket, currentBlockHeight: number) {
    const resolveBlock = calculateResolveBlockHeight(market.end_date_iso, currentBlockHeight);
    
    // Truncate to fit Clarity constraints
    const question = market.question.substring(0, 255); 
    const description = market.description.substring(0, 511);

    console.log(`\n-----------------------------------`);
    console.log(`📝 Preparing Market: "${question}"`);
    console.log(`   Resolve Date: ${market.end_date_iso} -> Block #${resolveBlock}`);
    
    if (DRY_RUN) {
        console.log('   [DRY RUN] Skipping transaction broadcast.');
        return;
    }

    const [contractAddress, contractName] = PREDICTION_MARKET_CONTRACT[NETWORK_ENV as keyof typeof PREDICTION_MARKET_CONTRACT].split('.');
    const [tokenAddress, tokenName] = TOKEN_CONTRACT[NETWORK_ENV as keyof typeof TOKEN_CONTRACT].split('.');

    const txOptions = {
        contractAddress,
        contractName,
        functionName: 'create-market',
        functionArgs: [
            stringAsciiCV(question),
            someCV(stringAsciiCV(description)),
            uintCV(resolveBlock),
            contractPrincipalCV(tokenAddress, tokenName)
        ],
        senderKey: PRIVATE_KEY,
        network: getNetwork(),
        anchorMode: AnchorMode.Any,
    };

    try {
        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTransaction({ transaction, network: getNetwork() });
        
        if ('error' in broadcastResponse) {
            console.error('   ❌ Transaction failed:', broadcastResponse.error);
        } else {
            console.log(`   ✅ Market created! TxID: ${broadcastResponse.txid}`);
        }
    } catch (error) {
        console.error('   ❌ Execution error:', error);
    }
}

async function main() {
    console.log(`🚀 PredictStack Market Seeder (${NETWORK_ENV})`);
    
    const currentBlock = await getCurrentBlockHeight();
    console.log(`📦 Current Stacks Block Height: ${currentBlock}`);
    
    const markets = await fetchPolymarketData();
    console.log(`🎯 Found ${markets.length} candidates.`);
    
    for (const market of markets) {
        await createStacksMarket(market, currentBlock);
    }
}

main();
