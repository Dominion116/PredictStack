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

  // Status priority:
  // • If the backend has already marked the market resolved/cancelled, trust that —
  //   the backend only sets those states AFTER broadcasting the tx, and the chain
  //   can lag by one full block (~10 min on testnet) before confirming.
  // • For active markets, prefer the live chain status so pool sizes / bets are current.
  const backendResolved = market.status === 'resolved' || market.status === 'cancelled';
  const status = backendResolved ? market.status : (chain?.status ?? market.status);

  // Pool sizes: aggregate confirmed bets from the backend store too.
  // Chain pools only update once the bet tx confirms (~10 min lag on testnet).
  // Backend bets are confirmed as soon as the user signs in their wallet, so
  // they give a more responsive view of true pool size. We take the max so
  // chain values win once they catch up.
  const confirmedBets = Object.values(state.bets).filter(
    b => Number(b.contractMarketId) === Number(contractMarketId) && b.status === 'confirmed'
  );
  const yesFromBets = confirmedBets
    .filter(b => b.outcome === true)
    .reduce((sum, b) => sum + Number(b.amountMicro || 0), 0);
  const noFromBets = confirmedBets
    .filter(b => b.outcome === false)
    .reduce((sum, b) => sum + Number(b.amountMicro || 0), 0);

  const yesPoolMicro = Math.max(Number(chain?.yesPoolMicro ?? 0), yesFromBets);
  const noPoolMicro  = Math.max(Number(chain?.noPoolMicro  ?? 0), noFromBets);
  const totalBets    = Math.max(Number(chain?.totalBets    ?? 0), confirmedBets.length);

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
    // Same priority as status: backend is authoritative once it has resolved.
    winningOutcome: backendResolved
      ? (market.winningOutcome ?? null)
      : (chain?.winningOutcome ?? market.winningOutcome ?? null),
    yesPoolMicro,
    noPoolMicro,
    totalBets,
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

export async function fetchPlatformConfig(stacks) {
  // read-only calls to get-platform-config etc.
  return {
    minBet: 20000,
    maxBet: 100000,
    fee: 10000,
  };
}

export async function fetchPlatformStats(stacks) {
  return { totalMarkets: 0, totalVolume: 0 };
}

export async function fetchMarketDetails(stacks, marketId) {
  // uses stacks.callReadOnly for get-market etc.
  return null;
}
