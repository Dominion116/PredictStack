import { sendJson } from '../middleware/http.mjs';
import { getActivityFeed } from '../services/activity-service.mjs';

export function createFeedRoutes() {
  return {
    /**
     * @swagger
     * /api/feed:
     *   get:
     *     summary: Get paginated activity feed
     *     tags: [Activity Feed]
     *     parameters:
     *       - in: query
     *         name: page
     *         schema: { type: integer, default: 1 }
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 20, maximum: 50 }
     *     responses:
     *       200:
     *         description: Paginated list of activity events
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 activities:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/ActivityEvent'
     *                 total: { type: integer }
     *                 page: { type: integer }
     *                 limit: { type: integer }
     */
    async list(req, res, searchParams) {
      const page = Number(searchParams.get('page') || 1);
      const limit = Number(searchParams.get('limit') || 20);
      const { activities, total } = await getActivityFeed(page, limit);
      return sendJson(res, 200, { activities, total, page, limit });
    },
  };
}
