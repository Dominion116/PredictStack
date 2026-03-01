/**
 * PredictStack — Polling-based Event Observer
 * ============================================
 * Uses Hiro's Stacks API to poll for contract events.
 * This approach doesn't require a self-hosted Chainhook node.
 */

import 'dotenv/config';
import axios from 'axios';

// ── Validate env ─────────────────────────────────────────────────────────────
const HIRO_API_KEY = process.env.HIRO_API_KEY;
const NETWORK = process.env.NEXT_PUBLIC_NETWORK ?? 'testnet';
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 15000);

const TESTNET_DEPLOYER = 'ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY';
const MAINNET_DEPLOYER = 'SP...'; // TODO: fill in once deployed to mainnet

const DEPLOYER = NETWORK === 'mainnet' ? MAINNET_DEPLOYER : TESTNET_DEPLOYER;
const CONTRACT_NAME = 'prediction-market-v6';
const CONTRACT_ID = `${DEPLOYER}.${CONTRACT_NAME}`;

const API_BASE = NETWORK === 'mainnet'
  ? 'https://api.hiro.so'
  : 'https://api.testnet.hiro.so';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};
if (HIRO_API_KEY) {
  headers['x-hiro-api-key'] = HIRO_API_KEY;
}

const api = axios.create({
  baseURL: API_BASE,
  headers,
});

// ── State ────────────────────────────────────────────────────────────────────
let lastProcessedBlock = 0;
let lastProcessedTxIndex = 0;

interface ContractEvent {
  event_index: number;
  event_type: string;
  tx_id: string;
  contract_log?: {
    contract_id: string;
    topic: string;
    value: {
      hex: string;
      repr: string;
    };
  };
}

interface Transaction {
  tx_id: string;
  tx_status: string;
  block_height: number;
  tx_index: number;
  tx_type: string;
  events?: ContractEvent[];
}

// ── Event handlers ───────────────────────────────────────────────────────────

function parseClarity(repr: string): Record<string, any> {
  // Simple Clarity tuple parser from repr string
  // Example: (tuple (event "market-created") (market-id u1) ...)
  const result: Record<string, any> = {};
  
  // Extract key-value pairs from tuple
  const tupleMatch = repr.match(/^\(tuple\s+(.+)\)$/s);
  if (!tupleMatch) return result;
  
  const content = tupleMatch[1];
  const regex = /\(([a-zA-Z\-]+)\s+([^()]+(?:\([^()]*\)[^()]*)*)\)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    let value: any = match[2].trim();
    
    // Parse different Clarity types
    if (value.startsWith('u')) {
      value = BigInt(value.slice(1));
    } else if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (value.startsWith("'")) {
      value = value.slice(1); // principal
    }
    
    result[key] = value;
  }
  
  return result;
}

async function handleEvent(event: ContractEvent, tx: Transaction): Promise<void> {
  if (event.event_type !== 'smart_contract_log') return;
  if (!event.contract_log) return;
  if (event.contract_log.contract_id !== CONTRACT_ID) return;

  const parsed = parseClarity(event.contract_log.value.repr);
  const eventName = parsed.event as string;

  console.log(`[${new Date().toISOString()}] Event: ${eventName}`);
  console.log(`  TX: ${tx.tx_id}`);
  console.log(`  Block: ${tx.block_height}`);
  console.log(`  Data:`, JSON.stringify(parsed, (_, v) => 
    typeof v === 'bigint' ? v.toString() : v, 2));

  // Route to specific handlers
  switch (eventName) {
    case 'market-created':
      await onMarketCreated(parsed, tx);
      break;
    case 'market-resolved':
      await onMarketResolved(parsed, tx);
      break;
    case 'market-cancelled':
      await onMarketCancelled(parsed, tx);
      break;
    case 'bet-placed':
      await onBetPlaced(parsed, tx);
      break;
    case 'winnings-claimed':
      await onWinningsClaimed(parsed, tx);
      break;
    case 'refund-claimed':
      await onRefundClaimed(parsed, tx);
      break;
    case 'platform-initialized':
    case 'fee-updated':
    case 'oracle-updated':
    case 'admin-updated':
    case 'treasury-updated':
    case 'platform-paused':
    case 'platform-unpaused':
    case 'min-bet-updated':
      await onAdminEvent(eventName, parsed, tx);
      break;
    default:
      console.log(`  Unknown event type: ${eventName}`);
  }
}

// ── Business handlers ────────────────────────────────────────────────────────

async function onMarketCreated(data: Record<string, any>, tx: Transaction): Promise<void> {
  console.log(`  → Market #${data['market-id']} created: "${data.question}"`);
  // TODO: Upsert to database, invalidate cache, etc.
}

async function onMarketResolved(data: Record<string, any>, tx: Transaction): Promise<void> {
  console.log(`  → Market #${data['market-id']} resolved: ${data['winning-outcome'] ? 'YES' : 'NO'}`);
}

async function onMarketCancelled(data: Record<string, any>, tx: Transaction): Promise<void> {
  console.log(`  → Market #${data['market-id']} cancelled`);
}

async function onBetPlaced(data: Record<string, any>, tx: Transaction): Promise<void> {
  console.log(`  → Bet placed on market #${data['market-id']}: ${data.amount} on ${data.outcome ? 'YES' : 'NO'}`);
}

async function onWinningsClaimed(data: Record<string, any>, tx: Transaction): Promise<void> {
  console.log(`  → Winnings claimed from market #${data['market-id']}: ${data['net-winnings']}`);
}

async function onRefundClaimed(data: Record<string, any>, tx: Transaction): Promise<void> {
  console.log(`  → Refund claimed from market #${data['market-id']}: ${data['refund-amount']}`);
}

async function onAdminEvent(eventName: string, data: Record<string, any>, tx: Transaction): Promise<void> {
  console.log(`  → Admin: ${eventName}`);
}

// ── Polling logic ────────────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 2000
): Promise<T | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error.response?.status;
      const isRetryable = status === 503 || status === 429 || status === 502;
      
      if (isRetryable && attempt < retries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[retry] Got ${status}, waiting ${delay}ms before retry ${attempt + 1}/${retries - 1}...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  return null;
}

async function fetchContractTransactions(): Promise<Transaction[]> {
  try {
    const result = await fetchWithRetry(async () => {
      const response = await api.get(`/extended/v1/address/${CONTRACT_ID}/transactions`, {
        params: {
          limit: 50,
          unanchored: true,
        },
      });
      return response.data.results || [];
    });
    return result || [];
  } catch (error: any) {
    console.error(`[error] Failed to fetch transactions:`, error.message);
    return [];
  }
}

async function fetchTransactionEvents(txId: string): Promise<ContractEvent[]> {
  try {
    const result = await fetchWithRetry(async () => {
      const response = await api.get(`/extended/v1/tx/${txId}`);
      return response.data.events || [];
    });
    return result || [];
  } catch (error: any) {
    console.error(`[error] Failed to fetch events for ${txId}:`, error.message);
    return [];
  }
}

async function poll(): Promise<void> {
  const transactions = await fetchContractTransactions();
  
  // Filter to only confirmed transactions we haven't processed
  const newTxs = transactions.filter(tx => 
    tx.tx_status === 'success' &&
    (tx.block_height > lastProcessedBlock ||
     (tx.block_height === lastProcessedBlock && tx.tx_index > lastProcessedTxIndex))
  );

  // Sort by block height and tx index
  newTxs.sort((a, b) => {
    if (a.block_height !== b.block_height) {
      return a.block_height - b.block_height;
    }
    return a.tx_index - b.tx_index;
  });

  for (const tx of newTxs) {
    // Fetch full events for this transaction
    const events = await fetchTransactionEvents(tx.tx_id);
    
    for (const event of events) {
      await handleEvent(event, tx);
    }

    // Update cursor
    lastProcessedBlock = tx.block_height;
    lastProcessedTxIndex = tx.tx_index;
  }
}

async function getCurrentBlockHeight(): Promise<number> {
  try {
    const result = await fetchWithRetry(async () => {
      const response = await api.get('/extended/v2/blocks?limit=1');
      return response.data.results[0]?.height || 0;
    });
    return result || 0;
  } catch (error: any) {
    console.error(`[error] Failed to fetch current block:`, error.message);
    return 0;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[observer] PredictStack Event Observer (Polling Mode)`);
  console.log(`[observer] Network:      ${NETWORK}`);
  console.log(`[observer] Contract:     ${CONTRACT_ID}`);
  console.log(`[observer] API Base:     ${API_BASE}`);
  console.log(`[observer] Poll Interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`[observer] API Key:      ${HIRO_API_KEY ? 'configured' : 'not set'}\n`);

  // Start from current block
  lastProcessedBlock = await getCurrentBlockHeight();
  console.log(`[observer] Starting from block ${lastProcessedBlock}\n`);
  console.log(`[observer] Polling for events... (Ctrl+C to stop)\n`);

  // Initial poll
  await poll();

  // Set up interval
  setInterval(async () => {
    try {
      await poll();
    } catch (error: any) {
      console.error(`[error] Poll failed:`, error.message);
    }
  }, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error('[observer] Fatal error:', err);
  process.exit(1);
});
