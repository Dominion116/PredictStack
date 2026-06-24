import { sendJson, sanitizeAddress } from '../middleware/http.mjs';
import { getUserAnalytics } from '../services/analytics-service.mjs';

export function createAnalyticsRoutes({ store }) {
  return {
    /**
     * GET /api/users/:address/analytics
     * Returns P&L series, win-rate stats, and category breakdown for a user.
     */
    async userAnalytics(req, res, address) {
      const safeAddress = sanitizeAddress(address);
      if (!safeAddress) return sendJson(res, 400, { error: 'address is required' });

      const analytics = getUserAnalytics(store.getState(), safeAddress);
      return sendJson(res, 200, analytics);
    },
  };
}
