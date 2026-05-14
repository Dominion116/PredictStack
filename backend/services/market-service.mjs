import { randomUUID } from 'node:crypto';

export function makeMarketRef() {
  return `mkt_${Date.now().toString(36)}_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export function computeClaimAmount(position, market) {
  if (!position || !market) return 0;
  if (market.status === 'cancelled') return position.totalWageredMicro;
  if (
    market.status !== 'resolved' ||
    market.winningOutcome === null ||
    market.winningOutcome === undefined
  ) return 0;

  const userWinningStake = market.winningOutcome ? position.yesAmountMicro : position.noAmountMicro;
  const winningPool = market.winningOutcome ? market.yesPoolMicro : market.noPoolMicro;
  const losingPool = market.winningOutcome ? market.noPoolMicro : market.yesPoolMicro;
  if (userWinningStake <= 0 || winningPool <= 0) return 0;

  const userShare = Math.floor((userWinningStake * losingPool) / winningPool);
  return userWinningStake + userShare;
}

export async function getMergedMarketByContractId(store, stacks, contractMarketId) {
  const state = store.getState();
  const marketId = state.marketRefsByContractId[String(contractMarketId)];
  if (!marketId) return null;
  const market = state.markets[marketId];
  if (!market) return null;

  let chain = null;
  try {
    chain = await stacks.getMarket(contractMarketId);
  } catch {
    chain = null;
  }

  // Chain status is a string in the deployed contract ("active"/"resolved"/"cancelled").
  // Fall back to the backend-stored status if the chain call failed.
  const status = chain?.status ?? market.status;

  return {
    id: market.id,
    question: market.question,
    description: market.description,
    category: market.category,
    // imageUrl is stored in the backend; ipfsHash may also be on-chain
    imageUrl: market.imageUrl ?? chain?.ipfsHash ?? null,
    resolveTimeIso: market.resolveTimeIso,
    resolveBlock: market.resolveBlock,
    createdAt: market.createdAt,
    updatedAt: market.updatedAt,
    createdBy: market.createdBy ?? chain?.creator ?? null,
    contractMarketId,
    contractTxId: market.contractTxId ?? null,
    resolutionTxId: market.resolutionTxId ?? null,
    marketRef: market.marketRef,
    chain: chain ?? {
      contractMarketId,
      creator: null,
      createdAtBlock: 0,
      resolveDateBlock: market.resolveBlock,
      yesPoolMicro: 0,
      noPoolMicro: 0,
      totalBets: 0,
      status: market.status,
      winningOutcome: market.winningOutcome ?? null,
      resolvedAtBlock: null,
    },
    status,
    winningOutcome: chain?.winningOutcome ?? market.winningOutcome ?? null,
    yesPoolMicro: chain?.yesPoolMicro ?? 0,
    noPoolMicro: chain?.noPoolMicro ?? 0,
    totalBets: chain?.totalBets ?? 0,
  };
}

export async function getAllMergedMarkets(store, stacks) {
  const state = store.getState();
  const contractIds = Object.keys(state.marketRefsByContractId)
    .map(Number)
    .sort((a, b) => b - a);
  const markets = await Promise.all(
    contractIds.map(id => getMergedMarketByContractId(store, stacks, id))
  );
  return markets.filter(Boolean);
}
