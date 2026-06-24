import { sendJson } from '../middleware/http.mjs';
import { CATEGORIES } from '../models/category.mjs';

export function createCategoryRoutes({ store }) {
  return {
    /**
     * GET /api/categories
     * Returns the canonical category list with market counts.
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
