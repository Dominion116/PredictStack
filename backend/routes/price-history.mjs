import { sendJson } from '../middleware/http.mjs';

let _col = null;

export function initPriceHistoryService(col) {
  _col = col;
}

export function createPriceHistoryRoutes() {
  return {
    /**
     * @swagger
     * /api/markets/{id}/price-history:
     *   get:
     *     summary: Get YES/NO odds history for a market
     *     tags: [Markets]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *       - in: query
     *         name: range
     *         schema:
     *           type: string
     *           enum: ['1h', '6h', '24h', 'all']
     *           default: 'all'
     *     responses:
     *       200:
     *         description: Array of price snapshots
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 history:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/PriceSnapshot'
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
