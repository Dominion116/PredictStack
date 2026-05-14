import { sendJson, readBody, sanitizeAddress } from '../middleware/http.mjs';
import {
  makeMarketRef,
  getMergedMarketByContractId,
  getAllMergedMarkets,
} from '../services/market-service.mjs';
import { recomputeUser } from '../services/user-service.mjs';

export function createMarketRoutes({ store, stacks }) {
  const getMerged = id => getMergedMarketByContractId(store, stacks, id);
  const getAllMerged = () => getAllMergedMarkets(store, stacks);

  return {
    async list(req, res, searchParams) {
      const limit = Number(searchParams.get('limit') || 50);
      const status = searchParams.get('status');
      let markets = await getAllMerged();
      if (status) markets = markets.filter(m => m.status === status);
      return sendJson(res, 200, { markets: markets.slice(0, limit) });
    },

    async getByContractId(req, res, contractMarketId) {
      const market = await getMerged(contractMarketId);
      if (!market) return sendJson(res, 404, { error: 'Market not found' });
      return sendJson(res, 200, { market });
    },

    async getById(req, res, marketId) {
      const market = store.getState().markets[marketId];
      if (!market) return sendJson(res, 404, { error: 'Market not found' });
      return sendJson(res, 200, { market: await getMerged(market.contractMarketId) });
    },

    async create(req, res) {
      const state = store.getState();
      const body = await readBody(req);
      const question = String(body.question || '').trim();
      const description = String(body.description || '').trim();
      const category = String(body.category || 'General').trim();
      const imageUrl = String(body.imageUrl || '').trim();
      const resolveTimeIso = String(body.resolveDate || '').trim();
      const resolveBlock = Number(body.resolveBlock || 0);
      const createdBy = sanitizeAddress(body.createdBy || stacks.signerAddress);

      if (!question || !resolveTimeIso || !Number.isFinite(resolveBlock) || resolveBlock <= 0) {
        return sendJson(res, 400, { error: 'question, resolveDate and resolveBlock are required' });
      }

      const marketRef = makeMarketRef();
      const contractMarketId = await stacks.getNextMarketId();
      // Deployed contract: create-market(question, description?, resolve-date, ipfs-hash?)
      const txId = await stacks.createMarket(question, description || null, resolveBlock, imageUrl || null);
      const now = new Date().toISOString();

      state.markets[marketRef] = {
        id: marketRef,
        marketRef,
        question,
        description,
        category,
        imageUrl,
        resolveTimeIso,
        resolveBlock,
        createdAt: now,
        updatedAt: now,
        createdBy,
        contractMarketId,
        contractTxId: txId,
        resolutionTxId: null,
        winningOutcome: null,
        status: 'active',
      };
      state.marketRefsByContractId[String(contractMarketId)] = marketRef;
      await store.save();

      return sendJson(res, 201, { market: await getMerged(contractMarketId) });
    },

    async resolve(req, res, marketId) {
      const state = store.getState();
      const market = state.markets[marketId];
      if (!market) return sendJson(res, 404, { error: 'Market not found' });

      const body = await readBody(req);
      const winningOutcome = Boolean(body.winningOutcome);
      const txId = await stacks.resolveMarket(market.contractMarketId, winningOutcome);

      market.status = 'resolved';
      market.winningOutcome = winningOutcome;
      market.resolutionTxId = txId;
      market.updatedAt = new Date().toISOString();

      for (const address of Object.keys(state.positions)) {
        recomputeUser(state, address);
      }

      await store.save();
      return sendJson(res, 200, { market: await getMerged(market.contractMarketId) });
    },
  };
}
