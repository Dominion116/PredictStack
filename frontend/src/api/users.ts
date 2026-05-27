import { backendFetch } from './client';
import { NETWORK_ENV } from '@/lib/constants';

export async function getStxBalance(address: string): Promise<number> {
  try {
    const apiUrl = NETWORK_ENV === 'mainnet'
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so';
    const response = await fetch(`${apiUrl}/extended/v1/address/${address}/stx`);
    if (!response.ok) throw new Error(`Failed to fetch STX balance: ${response.status}`);
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

export async function getUserMarkets(address: string): Promise<number[]> {
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

export interface BetHistoryEntry {
  betId: string;
  marketId: number;
  marketQuestion: string;
  outcome: boolean;
  amountMicro: number;
  status: 'pending' | 'confirmed' | 'failed';
  txId?: string;
  createdAt: string;
}

export async function getUserBetHistory(address: string, limit = 20): Promise<BetHistoryEntry[]> {
  try {
    const data = await backendFetch<{ bets: BetHistoryEntry[] }>(
      `/api/users/${address}/bets?limit=${limit}`
    );
    return data.bets;
  } catch {
    return [];
  }
}

export interface UserStats {
  totalBets: number;
  totalWageredMicro: number;
  totalWonMicro: number;
  winCount: number;
  lossCount: number;
  activePositions: number;
}

export async function getUserStats(address: string): Promise<UserStats | null> {
  try {
    const data = await backendFetch<{ stats: UserStats }>(`/api/users/${address}/stats`);
    return data.stats;
  } catch {
    return null;
  }
}
