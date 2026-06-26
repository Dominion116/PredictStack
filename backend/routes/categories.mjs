import { sendJson } from '../middleware/http.mjs';
import { CATEGORIES } from '../models/category.mjs';

export function createCategoryRoutes({ store }) {
  return {
    /**
     * @swagger
     * /api/categories:
     *   get:
     *     summary: List all canonical market categories with counts
     *     tags: [Markets]
     *     responses:
     *       200:
     *         description: Array of categories with market count
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 categories:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Category'
     */
    list(req, res) {
      const markets = Object.values(store.getState().markets ?? {});
      const counts = {};
      for (const m of markets) {
        const cat = m.category ?? 'Other';
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
      const categories = CATEGORIES.map(name => ({
        name,
        count: counts[name] ?? 0,
      }));
      return sendJson(res, 200, { categories });
    },
  };
}
