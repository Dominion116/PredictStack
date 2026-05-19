import { randomUUID } from 'node:crypto';
import { sendJson, readBody, sanitizeAddress } from '../middleware/http.mjs';
import { getMergedMarketByContractId } from '../services/market-service.mjs';
import { upsertUser, recomputeUser } from '../services/user-service.mjs';

export function createBetRoutes({ store, stacks, config }) {
  const getMerged = id => getMergedMarketByContractId(store, stacks, id);

  return {
    async createIntent(req, res) {
      const state = store.getState();
      const body = await readBody(req);
      const userAddress = sanitizeAddress(body.userAddress);
      const contractMarketId = Number(body.contractMarketId || 0);
      const amountMicro = Number(body.amountMicro || 0);
      const outcome = Boolean(body.outcome);

      if (!userAddress || !contractMarketId || !amountMicro) {
        return sendJson(res, 400, {
          error: 'userAddress, contractMarketId, amountMicro and outcome are required',
        });
      }

      const market = await getMerged(contractMarketId);
      if (!market) return sendJson(res, 404, { error: 'Market not found' });

      const postYesPoolMicro = outcome ? market.yesPoolMicro + amountMicro : market.yesPoolMicro;
      const postNoPoolMicro = outcome ? market.noPoolMicro : market.noPoolMicro + amountMicro;
      const postTotalPoolMicro = postYesPoolMicro + postNoPoolMicro;
      const selectedPostPoolMicro = outcome ? postYesPoolMicro : postNoPoolMicro;
      const selectedPostPriceBps = postTotalPoolMicro > 0
        ? Math.floor((selectedPostPoolMicro * 10_000) / postTotalPoolMicro)
        : 5_000;
      const maxAcceptedPriceBps = Math.min(10_000, selectedPostPriceBps + 300);

      const betId = randomUUID();
      state.bets[betId] = {
        id: betId,
        userAddress,
        marketId: market.id,
        contractMarketId,
        amountMicro,
        feeMicro: config.PLATFORM_FEE_MICRO,
        outcome,
        status: 'intent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        txId: null,
      };
      upsertUser(state, userAddress);
      await store.save();

      return sendJson(res, 201, {
        betId,
        contractCall: {
          contractAddress: stacks.contractAddress,
          contractName: stacks.contractName,
          functionName: 'place-bet-with-slippage',
          args: { marketId: contractMarketId, outcome, amountMicro, maxAcceptedPriceBps },
          postConditionAmountMicro: amountMicro + config.PLATFORM_FEE_MICRO,
        },
      });
    },

    async confirm(req, res) {
      const state = store.getState();
      const body = await readBody(req);
      const bet = state.bets[String(body.betId)];
      if (!bet) return sendJson(res, 404, { error: 'Bet intent not found' });

      bet.status = 'confirmed';
      bet.txId = String(body.txId || '');
      bet.updatedAt = new Date().toISOString();

      const address = bet.userAddress;
      const contractMarketId = String(bet.contractMarketId);
      state.positions[address] ||= {};
      state.positions[address][contractMarketId] ||= {
        userAddress: address,
        marketId: bet.marketId,
        contractMarketId: bet.contractMarketId,
        yesAmountMicro: 0,
        noAmountMicro: 0,
        totalWageredMicro: 0,
        claimableAmountMicro: 0,
        claimed: false,
        lastBetAt: null,
      };

      const position = state.positions[address][contractMarketId];
      if (bet.outcome) position.yesAmountMicro += bet.amountMicro;
      else position.noAmountMicro += bet.amountMicro;
      position.totalWageredMicro += bet.amountMicro;
      position.claimed = false;
      position.lastBetAt = new Date().toISOString();

      recomputeUser(state, address);
      await store.save();
      return sendJson(res, 200, { success: true, position });
    },
  };
}
