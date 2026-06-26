import { sendJson, readBody, sanitizeAddress } from '../middleware/http.mjs';
import { requireAddress, rejectInvalid } from '../middleware/validate.mjs';
import { getOrCreateReferral, getReferralStats } from '../services/referral-service.mjs';

export function createReferralRoutes() {
  return {
    /**
     * @swagger
     * /api/referrals/generate:
     *   post:
     *     summary: Get or create a referral code for an address
     *     tags: [Referrals]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [address]
     *             properties:
     *               address: { type: string }
     *     responses:
     *       200:
     *         description: Referral stats including code
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ReferralStats'
     */
    async generate(req, res) {
      const body = await readBody(req);
      if (rejectInvalid(res, requireAddress(body.address))) return;
      const address = sanitizeAddress(body.address);
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
     * @swagger
     * /api/referrals/{address}/stats:
     *   get:
     *     summary: Get referral stats for an address
     *     tags: [Referrals]
     *     parameters:
     *       - in: path
     *         name: address
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: Referral stats
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ReferralStats'
     *       404:
     *         description: No referral found for this address
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

    /**
     * @swagger
     * /api/referrals/leaderboard:
     *   get:
     *     summary: Top referrers sorted by referred count
     *     tags: [Referrals]
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 15 }
     *     responses:
     *       200:
     *         description: Top referrer list
     */
    async leaderboard(req, res, searchParams) {
      const { getReferralLeaderboard } = await import('../services/referral-service.mjs');
      const limit = Math.min(Number(searchParams.get('limit') || 15), 50);
      const entries = await getReferralLeaderboard(limit);
      return sendJson(res, 200, { entries });
    },
  };
}
