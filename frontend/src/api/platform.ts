import { backendFetch } from './client';

export async function getBackendConfig() {
  return backendFetch<{
    network: string;
    contractAddress: string;
    contractName: string;
    platformFeeMicro: number;
  }>('/api/config');
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
  } catch {
    return { 'total-markets': 0, 'total-volume': 0, 'total-users': 0, 'active-markets': 0 };
  }
}

export interface LeaderboardEntry {
  address: string;
  totalProfit: number;
  winRate: number;
  totalBets: number;
  rank: number;
}

export async function getLeaderboardData(limit = 15): Promise<LeaderboardEntry[]> {
  try {
    const data = await backendFetch<{ leaderboard: LeaderboardEntry[] }>(
      `/api/leaderboard?limit=${limit}`
    );
    return data.leaderboard.map(entry => ({
      ...entry,
      address: `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
    }));
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return [];
  }
}
