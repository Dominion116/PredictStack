import { backendFetch } from './client';

export async function confirmClaim(payload) {
  return backendFetch('/api/claims/confirm', { method: 'POST', body: JSON.stringify(payload) });
}
