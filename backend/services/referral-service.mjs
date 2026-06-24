import { buildReferral } from '../models/referral.mjs';

let _col = null;

export function initReferralService(col) {
  _col = col;
}

/**
 * Get or create a referral code for an address.
 */
export async function getOrCreateReferral(referrerAddress) {
  if (!_col) throw new Error('Referral service not initialized');
  const existing = await _col.findOne({ referrerAddress });
  if (existing) return existing;
  const doc = buildReferral(referrerAddress);
  const result = await _col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Get referral stats for an address.
 */
export async function getReferralStats(referrerAddress) {
  if (!_col) return null;
  return _col.findOne({ referrerAddress });
}

/**
 * Credit the referrer when a referred user places their first bet.
 * Reward: 10% of the bet fee (1,000 microSTX at current fee).
 */
export async function creditReferral(code, referredAddress, betAmountMicro) {
  if (!_col || !code) return;
  const REWARD_MICRO = Math.floor(betAmountMicro * 0.01); // 1% of bet
  await _col.updateOne(
    { code, referredAddresses: { $ne: referredAddress } },
    {
      $addToSet: { referredAddresses: referredAddress },
      $inc: { totalRewardsMicro: REWARD_MICRO },
    },
  );
}

/**
 * Look up a referral document by code (used when a referred user places a bet).
 */
export async function findByCode(code) {
  if (!_col) return null;
  return _col.findOne({ code: String(code).toUpperCase() });
}
