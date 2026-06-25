import { sendJson } from '../middleware/http.mjs';

let _col = null;

export function initPriceHistoryService(col) {
  _col = col;
}

export function createPriceHistoryRoutes() {
  return {
    /**
     * GET /api/markets/:id/price-history
     * Query: range = '1h' | '6h' | '24h' | 'all' (default 'all')
     */
    async list(req, res, marketId, searchParams) {
      if (!_col) return sendJson(res, 200, { history: [] });

      const range = searchParams.get('range') ?? 'all';
      const now = Date.now();
      const cutoff = range === '1h'  ? now - 3_600_000
                   : range === '6h'  ? now - 21_600_000
                   : range === '24h' ? now - 86_400_000
                   : 0;

      const filter = { marketId: Number(marketId) };
      if (cutoff > 0) filter.timestamp = { $gte: cutoff };

      const history = await _col
        .find(filter)
        .sort({ timestamp: 1 })
        .limit(500)
        .toArray();

      return sendJson(res, 200, { history });
    },
  };
}
