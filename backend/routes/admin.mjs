import { sendJson, sanitizeAddress } from '../middleware/http.mjs';
import { getAuditLog, computeAdminStats } from '../services/admin-service.mjs';
import { getMergedMarketByContractId } from '../services/market-service.mjs';
import { recomputeUser } from '../services/user-service.mjs';
import { emitMarketResolved } from '../services/activity-service.mjs';
import { logAudit } from '../services/admin-service.mjs';

export function createAdminRoutes({ store, stacks }) {
  return {
    /**
     * GET /api/admin/stats — 7-day rolling stats
     */
    stats(req, res) {
      const result = computeAdminStats(store.getState());
      return sendJson(res, 200, result);
    },

    /**
     * GET /api/admin/audit-log — paginated audit log
     */
    async auditLog(req, res, searchParams) {
      const page = Number(searchParams.get('page') || 1);
      const limit = Number(searchParams.get('limit') || 20);
      const result = await getAuditLog(page, limit);
      return sendJson(res, 200, result);
    },

    /**
     * POST /api/admin/markets/bulk-resolve
     * Body: { actorAddress, resolutions: [{ marketId, winningOutcome }] }
     */
    async bulkResolve(req, res) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');

      const actorAddress = sanitizeAddress(body.actorAddress);
      const resolutions = Array.isArray(body.resolutions) ? body.resolutions : [];
      if (!resolutions.length) return sendJson(res, 400, { error: 'resolutions array is required' });

      const state = store.getState();
      const results = [];

      for (const { marketId, winningOutcome } of resolutions) {
        const market = state.markets[String(marketId)];
        if (!market) { results.push({ marketId, ok: false, error: 'Not found' }); continue; }
        if (market.status !== 'active') { results.push({ marketId, ok: false, error: 'Not active' }); continue; }

        try {
          const txId = await stacks.resolveMarket(market.contractMarketId, Boolean(winningOutcome));
          market.status = 'resolved';
          market.winningOutcome = Boolean(winningOutcome);
          market.resolutionTxId = txId;
          market.updatedAt = new Date().toISOString();
          for (const addr of Object.keys(state.positions)) recomputeUser(state, addr);
          emitMarketResolved(actorAddress, market.contractMarketId, market.question, Boolean(winningOutcome));
          logAudit('market_resolved', actorAddress, marketId, { winningOutcome, txId });
          results.push({ marketId, ok: true, txId });
        } catch (err) {
          results.push({ marketId, ok: false, error: err.message });
        }
      }

      await store.save();
      return sendJson(res, 200, { results });
    },
  };
}
