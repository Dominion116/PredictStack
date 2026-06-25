import { backendFetch } from './client';

export type PriceRange = '1h' | '6h' | '24h' | 'all';

export interface PriceSnapshot {
  marketId: number;
  yes: number;
  no: number;
  timestamp: number;
}

export async function getPriceHistory(
  marketId: number | string,
  range: PriceRange = 'all',
): Promise<{ history: PriceSnapshot[] }> {
  return backendFetch<{ history: PriceSnapshot[] }>(
    `/api/markets/${marketId}/price-history?range=${range}`,
  );
}
