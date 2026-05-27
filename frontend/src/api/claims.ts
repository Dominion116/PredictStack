import { backendFetch } from './client';

export async function confirmClaim(payload: unknown): Promise<{ success: boolean }> {
  return backendFetch<{ success: boolean }>('/api/claims/confirm', { method: 'POST', body: JSON.stringify(payload) });
}

export interface ClaimIntentResponse {
  claimId: string;
  contractCall: {
    contractAddress: string;
    contractName: string;
    functionName: string;
    args: { marketId: number };
  };
}

export async function createClaimIntent(payload: {
  userAddress: string;
  contractMarketId: number;
  type: 'winnings' | 'refund';
}): Promise<ClaimIntentResponse> {
  return backendFetch<ClaimIntentResponse>('/api/claims/intents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
