import { backendFetch } from './client';

export async function createBetIntent(payload) {
  return backendFetch('/api/bets/intent', { method: 'POST', body: JSON.stringify(payload) });
}

export async function confirmBet(payload) {
  return backendFetch('/api/bets/confirm', { method: 'POST', body: JSON.stringify(payload) });
}
