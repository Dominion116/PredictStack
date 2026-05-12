import { backendFetch } from './client';

export async function confirmClaim(payload: {
  userAddress: string;
  contractMarketId: number;
  txId: string;
  type: 'winnings' | 'refund';
}) {
  return backendFetch<{ success: boolean; amountMicro: number }>('/api/claims/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
