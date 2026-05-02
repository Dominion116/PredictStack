import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  uintCV,
  boolCV,
} from '@stacks/transactions';
import {
  STACKS_TESTNET,
  STACKS_MAINNET,
  createNetwork,
} from '@stacks/network';
import { BACKEND_BASE_URL, getContractConfig, NETWORK_ENV } from './constants';

const config = getContractConfig();
const network = createNetwork(NETWORK_ENV === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET);

function extractValue(clarityValue: any): any {
  if (!clarityValue) return null;
  if (typeof clarityValue !== 'object') return clarityValue;
  if ('value' in clarityValue && 'type' in clarityValue) {
    if (clarityValue.type === 'none') return null;
    return extractValue(clarityValue.value);
  }
  return clarityValue;
}

async function backendFetch<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${pathname}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Backend request failed with ${response.status}`;
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json();
}

export async function getBackendConfig() {
  return backendFetch<{
    network: string;
    contractAddress: string;
    contractName: string;
    platformFeeMicro: number;
  }>('/api/config');
}

export async function getMarket(marketId: number) {
  try {
    const data = await backendFetch<{ market: any }>(`/api/markets/contract/${marketId}`);
    const market = data.market;
    return {
      id: market.contractMarketId,
      backendId: market.id,
      question: market.question,
      description: market.description,
      category: market.category,
      'image-url': market.imageUrl || null,
      'resolve-date': market.resolveBlock,
      'resolve-time-iso': market.resolveTimeIso,
      'yes-pool': market.yesPoolMicro,
      'no-pool': market.noPoolMicro,
      status: market.status,
      creator: market.chain?.creator || market.createdBy,
      contractTxId: market.contractTxId,
      resolutionTxId: market.resolutionTxId,
      totalBets: market.totalBets,
      outcome: market.winningOutcome ?? false,
      winningOutcome: market.winningOutcome,
      marketRef: market.marketRef,
    };
  } catch (error) {
    console.error(`Error fetching market ${marketId}:`, error);
    return null;
  }
}

export async function getPlatformStats() {
  try {
    const stats = await backendFetch<{
      totalMarkets: number;
      totalVolumeMicro: number;
      totalUsers: number;
      activeMarkets: number;
    }>('/api/platform/stats');
    return {
      'total-markets': stats.totalMarkets,
      'total-volume': stats.totalVolumeMicro,
      'total-users': stats.totalUsers,
      'active-markets': stats.activeMarkets,
    };
  } catch (error) {
    return { 'total-markets': 0, 'total-volume': 0, 'total-users': 0, 'active-markets': 0 };
  }
}

export async function getRecentMarkets(limit: number = 6) {
  try {
    const data = await backendFetch<{ markets: any[] }>(`/api/markets?limit=${limit}`);
    return data.markets.map(market => ({
      id: market.contractMarketId,
      backendId: market.id,
      question: market.question,
      description: market.description,
      category: market.category,
      'image-url': market.imageUrl || null,
      'resolve-date': market.resolveBlock,
      'resolve-time-iso': market.resolveTimeIso,
      'yes-pool': market.yesPoolMicro,
      'no-pool': market.noPoolMicro,
      status: market.status,
      creator: market.chain?.creator || market.createdBy,
      contractTxId: market.contractTxId,
      resolutionTxId: market.resolutionTxId,
      totalBets: market.totalBets,
      outcome: market.winningOutcome ?? false,
      winningOutcome: market.winningOutcome,
      marketRef: market.marketRef,
    }));
  } catch (error) {
    console.error('Error fetching recent markets:', error);
    return [];
  }
}

export async function getStxBalance(address: string) {
  try {
    const apiUrl = NETWORK_ENV === 'mainnet'
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so';
    const response = await fetch(`${apiUrl}/extended/v1/address/${address}/stx`);
    if (!response.ok) {
      throw new Error(`Failed to fetch STX balance: ${response.status}`);
    }

    const data = await response.json();
    return Number(data.balance || 0) / 1_000_000;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
}

export async function getUserPosition(address: string, marketId: number) {
  try {
    const data = await backendFetch<{ position: any }>(`/api/users/${address}/positions/${marketId}`);
    return {
      'yes-amount': data.position.yesAmountMicro,
      'no-amount': data.position.noAmountMicro,
      'total-wagered': data.position.totalWageredMicro,
      claimed: data.position.claimed,
    };
  } catch {
    return null;
  }
}

export async function getUserMarkets(address: string) {
  try {
    const data = await backendFetch<{ marketIds: number[] }>(`/api/users/${address}/markets`);
    return data.marketIds;
  } catch (error) {
    console.error('Error fetching user markets:', error);
    return [];
  }
}

export async function getUserDashboard(address: string) {
  return backendFetch<{
    summary: any;
    positions: Array<{ market: any; position: any }>;
  }>(`/api/users/${address}/dashboard`);
}

interface ContractEvent {
  event_type: string;
  tx_id: string;
  block_height: number;
  timestamp: number;
  data: any;
}

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
          const logData = event.contract_log?.value?.repr;
          if (logData) {
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
              data: event.contract_log?.value,
            });
          }
        } catch {
          // Skip unparseable events
        }
      }
    }

    return events;
  } catch (error) {
    console.error('Error fetching contract events:', error);
    return [];
  }
}

interface LeaderboardEntry {
  address: string;
  totalProfit: number;
  winRate: number;
  totalBets: number;
  rank: number;
}

export async function getLeaderboardData(limit: number = 15): Promise<LeaderboardEntry[]> {
  try {
    const data = await backendFetch<{ leaderboard: LeaderboardEntry[] }>(`/api/leaderboard?limit=${limit}`);
    return data.leaderboard.map(entry => ({
      ...entry,
      address: `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
    }));
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return [];
  }
}

interface QuotePrice {
  currentPriceBps: number;
  postTradePriceBps: number;
  priceImpactBps: number;
}

interface QuoteShares {
  poolShareBps: number;
  projectedProfit: number;
  projectedPayout: number;
  entryFee: number;
}

export async function getQuotePrice(
  marketId: number,
  outcome: boolean,
  amountMicro: number
): Promise<QuotePrice | null> {
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: config.deployer,
      contractName: config.predictionMarket,
      functionName: 'quote-price',
      functionArgs: [uintCV(marketId), boolCV(outcome), uintCV(amountMicro)],
      network,
      senderAddress: config.deployer,
    });

    const json: any = cvToJSON(response);
    if (json.success && json.value && json.value.value) {
      const quote = json.value.value;
      return {
        currentPriceBps: Number(extractValue(quote['current-price-bps']) || 0),
        postTradePriceBps: Number(extractValue(quote['post-trade-price-bps']) || 0),
        priceImpactBps: Number(extractValue(quote['price-impact-bps']) || 0),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching price quote:', error);
    return null;
  }
}

export async function getQuoteShares(
  marketId: number,
  outcome: boolean,
  amountMicro: number
): Promise<QuoteShares | null> {
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: config.deployer,
      contractName: config.predictionMarket,
      functionName: 'quote-shares',
      functionArgs: [uintCV(marketId), boolCV(outcome), uintCV(amountMicro)],
      network,
      senderAddress: config.deployer,
    });

    const json: any = cvToJSON(response);
    if (json.success && json.value && json.value.value) {
      const quote = json.value.value;
      return {
        poolShareBps: Number(extractValue(quote['pool-share-bps']) || 0),
        projectedProfit: Number(extractValue(quote['projected-profit']) || 0) / 1_000_000,
        projectedPayout: Number(extractValue(quote['projected-payout']) || 0) / 1_000_000,
        entryFee: Number(extractValue(quote['entry-fee']) || 0) / 1_000_000,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching shares quote:', error);
    return null;
  }
}

export async function createMarketRecord(payload: {
  question: string;
  description: string;
  category: string;
  imageUrl: string;
  resolveDate: string;
  resolveBlock: number;
  createdBy: string;
}) {
  return backendFetch<{ market: any }>('/api/markets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resolveMarketRecord(backendMarketId: string, winningOutcome: boolean) {
  return backendFetch<{ market: any }>(`/api/markets/${backendMarketId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ winningOutcome }),
  });
}

export async function createBetIntent(payload: {
  userAddress: string;
  contractMarketId: number;
  amountMicro: number;
  outcome: boolean;
}) {
  return backendFetch<{
    betId: string;
    contractCall: {
      contractAddress: string;
      contractName: string;
      functionName: string;
      args: {
        marketId: number;
        outcome: boolean;
        amountMicro: number;
        maxAcceptedPriceBps: number;
      };
      postConditionAmountMicro: number;
    };
  }>('/api/bets/intents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmBet(payload: { betId: string; txId: string }) {
  return backendFetch<{ success: boolean }>('/api/bets/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmClaim(payload: {
  userAddress: string;
  contractMarketId: number;
  txId: string;
  type: 'winnings' | 'refund';
}) {
  return backendFetch<{ success: boolean; amountMicro: number }>('/api/claims/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
