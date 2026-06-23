import { backendFetch } from './client';

export type ActivityType = 'bet_placed' | 'market_created' | 'market_resolved' | 'claim_made';

export interface ActivityEvent {
  _id: string;
  type: ActivityType;
  actorAddress: string;
  marketId: number | null;
  marketQuestion: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityFeedResponse {
  activities: ActivityEvent[];
  total: number;
  page: number;
  limit: number;
}

export async function getActivityFeed(
  page = 1,
  limit = 20,
): Promise<ActivityFeedResponse> {
  return backendFetch<ActivityFeedResponse>(`/api/feed?page=${page}&limit=${limit}`);
}
