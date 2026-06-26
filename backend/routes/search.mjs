import { sendJson } from '../middleware/http.mjs';

/**
 * In-memory full-text search over the markets store.
 * For production scale, replace with MongoDB text index queries.
 *
 * GET /api/markets/search?q=bitcoin
 * GET /api/markets/suggest?q=bit  (returns up to 5 titles)
 */

function tokenize(text) {
  return String(text ?? '').toLowerCase().split(/\s+/).filter(Boolean);
}

function scoreMarket(market, queryTokens) {
  const questionTokens = tokenize(market.question);
  const descTokens = tokenize(market.description ?? '');
  const tagTokens = (market.tags ?? []).flatMap(tokenize);

  let score = 0;
  for (const qt of queryTokens) {
    if (questionTokens.some(t => t.includes(qt))) score += 3;
    if (descTokens.some(t => t.includes(qt))) score += 1;
    if (tagTokens.some(t => t.includes(qt))) score += 2;
  }
  return score;
}

export function createSearchRoutes({ store }) {
  return {
    /**
     * @swagger
     * /api/markets/search:
     *   get:
     *     summary: Full-text search across markets
     *     tags: [Search]
     *     parameters:
     *       - in: query
     *         name: q
     *         required: true
     *         schema: { type: string }
     *         description: Search query
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 20, maximum: 50 }
     *     responses:
     *       200:
     *         description: Scored list of matching markets
     *       400:
     *         description: q parameter is required
     */
    search(req, res, searchParams) {
      const q = (searchParams.get('q') ?? '').trim();
      if (!q) return sendJson(res, 400, { error: 'q query parameter is required' });

      const limit = Math.min(Number(searchParams.get('limit') || 20), 50);
      const queryTokens = tokenize(q);
      const markets = Object.values(store.getState().markets ?? {});

      const scored = markets
        .map(m => ({ market: m, score: scoreMarket(m, queryTokens) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ market }) => market);

      return sendJson(res, 200, { markets: scored, query: q });
    },

    /**
     * @swagger
     * /api/markets/suggest:
     *   get:
     *     summary: Autocomplete market titles
     *     tags: [Search]
     *     parameters:
     *       - in: query
     *         name: q
     *         required: true
     *         schema: { type: string, minLength: 2 }
     *     responses:
     *       200:
     *         description: Up to 5 matching market title suggestions
     */
    suggest(req, res, searchParams) {
      const q = (searchParams.get('q') ?? '').trim().toLowerCase();
      if (!q || q.length < 2) return sendJson(res, 200, { suggestions: [] });

      const markets = Object.values(store.getState().markets ?? {});
      const suggestions = markets
        .filter(m => m.question?.toLowerCase().includes(q))
        .slice(0, 5)
        .map(m => ({ id: m.id, question: m.question }));

      return sendJson(res, 200, { suggestions });
    },
  };
}
