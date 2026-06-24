/**
 * Referral model — stored in `referrals` MongoDB collection.
 *
 * Schema:
 *   _id            — MongoDB ObjectId (auto)
 *   referrerAddress — STX address of the user who owns the referral code
 *   code           — 8-char alphanumeric code (unique index)
 *   referredAddresses — array of addresses who used this code
 *   totalRewardsMicro — cumulative STX earned from referrals
 *   createdAt      — ISO 8601 timestamp
 */

import { randomBytes } from 'node:crypto';

export function generateReferralCode() {
  return randomBytes(4).toString('hex').toUpperCase(); // e.g. 'A3F2C1D9'
}

export function buildReferral(referrerAddress) {
  return {
    referrerAddress: String(referrerAddress),
    code: generateReferralCode(),
    referredAddresses: [],
    totalRewardsMicro: 0,
    createdAt: new Date().toISOString(),
  };
}
