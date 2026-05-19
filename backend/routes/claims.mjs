import { randomUUID } from 'node:crypto';
import { sendJson, readBody, sanitizeAddress } from '../middleware/http.mjs';
import { getMergedMarketByContractId, computeClaimAmount } from '../services/market-service.mjs';
import { getUserPositionRecord, recomputeUser } from '../services/user-service.mjs';

export function createClaimRoutes({ store, stacks }) {
  const getMerged = id => getMergedMarketByContractId(store, stacks, id);

  return {
    async confirm(req, res) {
      const state = store.getState();
      const body = await readBody(req);
      const userAddress = sanitizeAddress(body.userAddress);
      const contractMarketId = Number(body.contractMarketId || 0);
      const type = String(body.type || 'winnings');
      const txId = String(body.txId || '');
      const position = getUserPositionRecord(state, userAddress, contractMarketId);

      if (!position) return sendJson(res, 404, { error: 'Position not found' });
      if (!contractMarketId) return sendJson(res, 400, { error: 'Invalid market-id' });

      const market = await getMerged(contractMarketId);
      if (!market) return sendJson(res, 404, { error: 'Market not found' });

      const claimId = randomUUID();
      const amountMicro = computeClaimAmount(position, {
        status: type === 'refund' ? 'cancelled' : market.status,
        winningOutcome: market.winningOutcome,
        yesPoolMicro: market.yesPoolMicro,
        noPoolMicro: market.noPoolMicro,
      });

      state.claims[claimId] = {
        id: claimId,
        userAddress,
        contractMarketId,
        marketId: position.marketId,
        type,
        txId,
        amountMicro,
        createdAt: new Date().toISOString(),
      };
      position.claimed = true;
      position.claimableAmountMicro = amountMicro;
      recomputeUser(state, userAddress);
      await store.save();

      return sendJson(res, 200, { success: true, amountMicro });
    },
  };
}
