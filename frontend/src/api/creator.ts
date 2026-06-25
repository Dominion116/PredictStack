import { backendFetch } from './client';

export interface CreatorStats {
  address: string;
  marketsCreated: number;
  marketsResolved: number;
  resolutionRate: number;
  totalVolumeMicro: number;
}

export async function getCreatorStats(address: string): Promise<CreatorStats> {
  return backendFetch<CreatorStats>(`/api/users/${address}/creator-stats`);
}

export async function getCreatedMarkets(address: string): Promise<{ markets: any[] }> {
  return backendFetch<{ markets: any[] }>(`/api/users/${address}/created-markets`);
}
