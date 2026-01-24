
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
  contractPrincipalCV,
  getAddressFromPrivateKey
} from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET, createNetwork } from '@stacks/network';
import 'dotenv/config';

// Constants
const POLYMARKET_API_URL = 'https://clob.polymarket.com/markets';
const PREDICTION_MARKET_CONTRACT = {
    testnet: 'ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY.prediction-market',
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

// Transaction Versions
const TRANSACTION_VERSION_MAINNET = 0x00;
const TRANSACTION_VERSION_TESTNET = 0x80;

if (!PRIVATE_KEY && !DRY_RUN) {
    console.error('Error: STACKS_PRIVATE_KEY not found in .env');
    process.exit(1);
}

// Helpers
const getNetwork = () => createNetwork(NETWORK_ENV === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET);

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


// Helper to ensure ASCII only
function toAscii(str: string): string {
    // Remove non-ASCII characters
    return str.replace(/[^\x00-\x7F]/g, "").trim();
}

async function createStacksMarket(market: PolymarketMarket, currentBlockHeight: number, nonce: bigint) {
    const resolveBlock = calculateResolveBlockHeight(market.end_date_iso, currentBlockHeight);
    
    // Truncate to fit Clarity constraints and ensure ASCII
    const question = toAscii(market.question).substring(0, 255); 
    const description = toAscii(market.description).substring(0, 511);
    const conditionId = toAscii(market.condition_id);

    console.log(`\n-----------------------------------`);
    console.log(`📝 Preparing Market: "${question}"`);
    console.log(`   Resolve Date: ${market.end_date_iso} -> Block #${resolveBlock}`);
    console.log(`   Nonce: ${nonce}`);
    
    if (question.length === 0) {
        console.log('   [SKIP] Question is empty after ASCII sanitization or originally empty.');
        return;
    }

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
            someCV(stringAsciiCV(conditionId)),
            contractPrincipalCV(tokenAddress, tokenName)
        ],
        senderKey: PRIVATE_KEY,
        network: getNetwork(),
        anchorMode: AnchorMode.Any,
        nonce: nonce
    };

    try {
        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTransaction({ transaction, network: getNetwork() });
        
        if ('error' in broadcastResponse) {
            console.error('   ❌ Transaction failed:', broadcastResponse.error);
            console.error('   Reason:', broadcastResponse.reason);
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
    
    // Get starting nonce
    const senderAddress = 'ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY';
    const nonceResponse = await axios.get(`https://api.${NETWORK_ENV}.hiro.so/extended/v1/address/${senderAddress}/nonces`);
    let nonce = BigInt(nonceResponse.data.possible_next_nonce);
    console.log(`🔢 Starting Nonce: ${nonce}`);

    for (const market of markets) {
        console.log(`Processing market with nonce ${nonce}`);
        await createStacksMarket(market, currentBlock, nonce);
        // Add a small delay for good measure
        await new Promise(r => setTimeout(r, 1000));
        nonce += 1n;
    }
}

main();
