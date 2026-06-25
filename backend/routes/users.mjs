import { sendJson, sanitizeAddress } from '../middleware/http.mjs';
import { getMergedMarketByContractId } from '../services/market-service.mjs';
import { upsertUser, getUserPositionRecord, recomputeUser } from '../services/user-service.mjs';

export function createUserRoutes({ store, stacks }) {
  const getMerged = id => getMergedMarketByContractId(store, stacks, id);

  return {
    markets(req, res, address) {
      const positions = Object.values(store.getState().positions[address] ?? {});
      return sendJson(res, 200, { marketIds: positions.map(p => p.contractMarketId) });
    },

    position(req, res, address, contractMarketId) {
      const position = getUserPositionRecord(store.getState(), address, contractMarketId);
      if (!position) return sendJson(res, 404, { error: 'Position not found' });
      return sendJson(res, 200, { position });
    },

    async dashboard(req, res, address) {
      const state = store.getState();
      upsertUser(state, address);
      recomputeUser(state, address);
      await store.save();

      const summary = state.users[address];
      const positions = Object.values(state.positions[address] ?? {});
      const markets = await Promise.all(
        positions.map(async position => ({
          market: await getMerged(position.contractMarketId),
          position,
        }))
      );

      return sendJson(res, 200, {
        summary,
        positions: markets.filter(item => item.market),
      });
    },

    createdMarkets(req, res, address) {
      const state = store.getState();
      const created = Object.values(state.markets ?? {}).filter(
        m => m.createdBy === sanitizeAddress(address),
      );
      return sendJson(res, 200, { markets: created });
    },

    creatorStats(req, res, address) {
      const state = store.getState();
      const addr = sanitizeAddress(address);
      const created = Object.values(state.markets ?? {}).filter(m => m.createdBy === addr);
      const resolved = created.filter(m => m.status === 'resolved');
      const totalVolumeMicro = Object.values(state.bets ?? {})
        .filter(b => b.status === 'confirmed' && created.some(m => m.contractMarketId === b.contractMarketId))
        .reduce((s, b) => s + b.amountMicro, 0);

      return sendJson(res, 200, {
        address: addr,
        marketsCreated: created.length,
        marketsResolved: resolved.length,
        resolutionRate: created.length > 0 ? Math.round((resolved.length / created.length) * 100) : 0,
        totalVolumeMicro,
      });
    },
  };
}
