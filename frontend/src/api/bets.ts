import { backendFetch } from './client';

export interface BetIntentResponse {
  betId: string;
  contractCall: {
    contractAddress: string;
    contractName: string;
    functionName: string;
    args: { marketId: number; outcome: boolean; amountMicro: number; maxAcceptedPriceBps: number };
    postConditionAmountMicro: number;
  };
}

export async function createBetIntent(payload: unknown): Promise<BetIntentResponse> {
  return backendFetch<BetIntentResponse>('/api/bets/intents', { method: 'POST', body: JSON.stringify(payload) });
}

export async function confirmBet(payload: unknown): Promise<{ success: boolean }> {
  return backendFetch<{ success: boolean }>('/api/bets/confirm', { method: 'POST', body: JSON.stringify(payload) });
}
