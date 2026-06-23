import { sendJson } from '../middleware/http.mjs';
import { getActivityFeed } from '../services/activity-service.mjs';

export function createFeedRoutes() {
  return {
    /**
     * GET /api/feed
     * Query params: page (default 1), limit (default 20, max 50)
     */
    async list(req, res, searchParams) {
      const page = Number(searchParams.get('page') || 1);
      const limit = Number(searchParams.get('limit') || 20);
      const { activities, total } = await getActivityFeed(page, limit);
      return sendJson(res, 200, { activities, total, page, limit });
    },
  };
}
