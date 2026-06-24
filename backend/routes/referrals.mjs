import { sendJson, readBody, sanitizeAddress } from '../middleware/http.mjs';
import { getOrCreateReferral, getReferralStats } from '../services/referral-service.mjs';

export function createReferralRoutes() {
  return {
    /**
     * POST /api/referrals/generate
     * Body: { address }
     * Returns existing or newly created referral code for the address.
     */
    async generate(req, res) {
      const body = await readBody(req);
      const address = sanitizeAddress(body.address);
      if (!address) return sendJson(res, 400, { error: 'address is required' });
      try {
        const referral = await getOrCreateReferral(address);
        return sendJson(res, 200, {
          code: referral.code,
          referredCount: referral.referredAddresses?.length ?? 0,
          totalRewardsMicro: referral.totalRewardsMicro ?? 0,
        });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    },

    /**
     * GET /api/referrals/:address/stats
     */
    async stats(req, res, address) {
      const referral = await getReferralStats(sanitizeAddress(address));
      if (!referral) return sendJson(res, 404, { error: 'No referral found for this address' });
      return sendJson(res, 200, {
        code: referral.code,
        referredCount: referral.referredAddresses?.length ?? 0,
        totalRewardsMicro: referral.totalRewardsMicro ?? 0,
      });
    },
  };
}
