import { sendJson, sanitizeAddress } from '../middleware/http.mjs';
import { getUserAnalytics } from '../services/analytics-service.mjs';

export function createAnalyticsRoutes({ store }) {
  return {
    /**
     * @swagger
     * /api/users/{address}/analytics:
     *   get:
     *     summary: Get portfolio analytics for a user
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: address
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: P&L series, win-rate stats, and category breakdown
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 pnlSeries:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       date: { type: string }
     *                       cumulativeProfitMicro: { type: number }
     *                 winRate:
     *                   type: object
     *                   properties:
     *                     totalBets: { type: number }
     *                     wins: { type: number }
     *                     losses: { type: number }
     *                     winRate: { type: number }
     *                 categoryBreakdown:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       category: { type: string }
     *                       count: { type: number }
     *                       totalMicro: { type: number }
     */
    async userAnalytics(req, res, address) {
      const safeAddress = sanitizeAddress(address);
      if (!safeAddress) return sendJson(res, 400, { error: 'address is required' });

      const analytics = getUserAnalytics(store.getState(), safeAddress);
      return sendJson(res, 200, analytics);
    },
  };
}
