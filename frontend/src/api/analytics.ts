import { backendFetch } from './client';

export interface PnlPoint {
  date: string;
  cumulativeProfitMicro: number;
}

export interface WinRateStats {
  totalBets: number;
  resolvedBets: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  totalMicro: number;
}

export interface UserAnalytics {
  pnlSeries: PnlPoint[];
  winRate: WinRateStats;
  categoryBreakdown: CategoryBreakdownItem[];
}

export async function getUserAnalytics(address: string): Promise<UserAnalytics> {
  return backendFetch<UserAnalytics>(`/api/users/${address}/analytics`);
}
