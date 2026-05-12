import { backendFetch } from './client';

export async function createBetIntent(payload: {
  userAddress: string;
  contractMarketId: number;
  amountMicro: number;
  outcome: boolean;
}) {
  return backendFetch<{
    betId: string;
    contractCall: {
      contractAddress: string;
      contractName: string;
      functionName: string;
      args: {
        marketId: number;
        outcome: boolean;
        amountMicro: number;
        maxAcceptedPriceBps: number;
      };
      postConditionAmountMicro: number;
    };
  }>('/api/bets/intents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmBet(payload: { betId: string; txId: string }) {
  return backendFetch<{ success: boolean }>('/api/bets/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
