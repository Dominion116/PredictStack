import { backendFetch } from './client';

export interface ReferralStats {
  code: string;
  referredCount: number;
  totalRewardsMicro: number;
}

export async function generateReferralCode(address: string): Promise<ReferralStats> {
  return backendFetch<ReferralStats>('/api/referrals/generate', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
}

export async function getReferralStats(address: string): Promise<ReferralStats> {
  return backendFetch<ReferralStats>(`/api/referrals/${address}/stats`);
}
