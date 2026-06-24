import { backendFetch } from './client';

export interface DailyAdminStat {
  date: string;
  bets: number;
  volumeMicro: number;
  newUsers: number;
}

export interface AdminStats {
  days: DailyAdminStat[];
}

export interface AuditEntry {
  _id: string;
  action: string;
  actorAddress: string;
  targetId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogResponse {
  entries: AuditEntry[];
  total: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  return backendFetch<AdminStats>('/api/admin/stats');
}

export async function getAuditLog(page = 1, limit = 20): Promise<AuditLogResponse> {
  return backendFetch<AuditLogResponse>(`/api/admin/audit-log?page=${page}&limit=${limit}`);
}

export async function bulkResolveMarkets(
  actorAddress: string,
  resolutions: { marketId: string; winningOutcome: boolean }[],
) {
  return backendFetch('/api/admin/markets/bulk-resolve', {
    method: 'POST',
    body: JSON.stringify({ actorAddress, resolutions }),
  });
}
