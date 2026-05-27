import { backendFetch } from './client';

function toMarketShape(market: any) {
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
}

export async function getMarket(marketId: number) {
  try {
    const data = await backendFetch<{ market: any }>(`/api/markets/contract/${marketId}`);
    return toMarketShape(data.market);
  } catch (error) {
    console.error(`Error fetching market ${marketId}:`, error);
    return null;
  }
}

export async function getRecentMarkets(limit = 6) {
  try {
    const data = await backendFetch<{ markets: any[] }>(`/api/markets?limit=${limit}`);
    return data.markets.map(toMarketShape);
  } catch (error) {
    console.error('Error fetching recent markets:', error);
    return [];
  }
}

export async function getNextMarketId(): Promise<number> {
  const data = await backendFetch<{ contractMarketId: number }>('/api/markets/next-id');
  return data.contractMarketId;
}

export async function createMarketRecord(payload: {
  question: string;
  description: string;
  category: string;
  imageUrl: string;
  resolveDate: string;
  resolveBlock: number;
  createdBy: string;
  // If txId + contractMarketId are provided, the backend skips blockchain signing
  txId?: string;
  contractMarketId?: number;
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

export async function getPlatformConfig() {
  return backendFetch('/api/platform/config');
}

export async function getMarkets(filters: Record<string, string> = {}): Promise<{ markets: any[] }> {
  const params = new URLSearchParams(filters).toString();
  return backendFetch<{ markets: any[] }>(`/api/markets?${params}`);
}

export async function getMarketByRef(ref: string) {
  return backendFetch(`/api/markets/ref/${ref}`);
}

export async function getOdds(marketId: string | number) {
  return backendFetch(`/api/markets/${marketId}/odds`);
}

export async function getQuotes(marketId: string | number) {
  return backendFetch(`/api/markets/${marketId}/quotes`);
}

export async function getMarketsByCategory(category: string, limit = 20) {
  try {
    const data = await backendFetch<{ markets: any[] }>(
      `/api/markets?category=${encodeURIComponent(category)}&limit=${limit}`
    );
    return data.markets.map(toMarketShape);
  } catch {
    return [];
  }
}

export async function searchMarkets(query: string, limit = 20) {
  try {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const data = await backendFetch<{ markets: any[] }>(`/api/markets/search?${params}`);
    return data.markets.map(toMarketShape);
  } catch {
    return [];
  }
}

export async function getTopMarkets(by: 'volume' | 'bets' = 'volume', limit = 10) {
  try {
    const data = await backendFetch<{ markets: any[] }>(
      `/api/markets?sort=${by === 'volume' ? 'volume' : 'bets'}&limit=${limit}&status=active`
    );
    return data.markets.map(toMarketShape);
  } catch {
    return [];
  }
}

export interface MarketActivityEntry {
  type: 'bet' | 'resolve' | 'cancel';
  userAddress?: string;
  outcome?: boolean;
  amountMicro?: number;
  txId?: string;
  createdAt: string;
}

export async function getMarketActivity(marketId: number, limit = 10): Promise<MarketActivityEntry[]> {
  try {
    const data = await backendFetch<{ activity: MarketActivityEntry[] }>(
      `/api/markets/${marketId}/activity?limit=${limit}`
    );
    return data.activity;
  } catch {
    return [];
  }
}
