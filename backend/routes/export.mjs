import { sanitizeAddress } from '../middleware/http.mjs';

export function createExportRoutes({ store }) {
  return {
    /**
     * GET /api/users/:address/export
     * Streams a CSV file of the user's full bet history.
     * Columns: date, market, outcome, amountSTX, result, pnlSTX
     */
    csvExport(req, res, address) {
      const safeAddress = sanitizeAddress(address);
      if (!safeAddress) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'address is required' }));
      }

      const state = store.getState();
      const bets = Object.values(state.bets ?? {}).filter(
        b => b.userAddress === safeAddress && b.status === 'confirmed',
      );

      const rows = [['date', 'market', 'outcome', 'amountSTX', 'result', 'pnlSTX']];

      for (const bet of bets) {
        const market = state.markets[bet.marketId];
        const question = market?.question ?? bet.marketId;
        const date = bet.createdAt?.slice(0, 10) ?? '';
        const outcome = bet.outcome ? 'YES' : 'NO';
        const amountSTX = (bet.amountMicro / 1_000_000).toFixed(6);

        let result = 'pending';
        let pnlSTX = '0';

        if (market?.status === 'resolved') {
          const userWon =
            (bet.outcome === true && market.winningOutcome === true) ||
            (bet.outcome === false && market.winningOutcome === false);
          result = userWon ? 'win' : 'loss';

          const pos = state.positions?.[safeAddress]?.[String(bet.contractMarketId)];
          const claimed = pos?.claimableAmountMicro ?? 0;
          pnlSTX = userWon
            ? ((claimed - bet.amountMicro) / 1_000_000).toFixed(6)
            : (-bet.amountMicro / 1_000_000).toFixed(6);
        } else if (market?.status === 'cancelled') {
          result = 'refund';
          pnlSTX = '0';
        }

        rows.push([date, `"${question.replace(/"/g, '""')}"`, outcome, amountSTX, result, pnlSTX]);
      }

      const csv = rows.map(r => r.join(',')).join('\n');
      const filename = `predictstack-${safeAddress.slice(0, 8)}-bets.csv`;

      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(csv);
    },
  };
}
