import { backendFetch } from './client';

export async function confirmClaim(payload: unknown): Promise<{ success: boolean }> {
  return backendFetch<{ success: boolean }>('/api/claims/confirm', { method: 'POST', body: JSON.stringify(payload) });
}
