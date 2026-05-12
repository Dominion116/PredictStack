export function upsertUser(state, address) {
  const now = new Date().toISOString();
  if (!state.users[address]) {
    state.users[address] = {
      address,
      joinedAt: now,
      updatedAt: now,
      totalInvestedMicro: 0,
      totalClaimedMicro: 0,
      totalProfitMicro: 0,
      activePredictions: 0,
      resolvedPredictions: 0,
      winCount: 0,
      lossCount: 0,
      pendingClaimCount: 0,
      totalBets: 0,
      marketIds: [],
    };
  }
  state.users[address].updatedAt = now;
  return state.users[address];
}

export function getUserPositionRecord(state, address, contractMarketId) {
  return state.positions[address]?.[String(contractMarketId)] ?? null;
}

export function recomputeUser(state, address) {
  const user = upsertUser(state, address);
  const positions = Object.values(state.positions[address] ?? {});

  user.totalInvestedMicro = positions.reduce((sum, p) => sum + p.totalWageredMicro, 0);
  user.totalClaimedMicro = Object.values(state.claims)
    .filter(c => c.userAddress === address)
    .reduce((sum, c) => sum + (c.amountMicro || 0), 0);
  user.totalProfitMicro = user.totalClaimedMicro - user.totalInvestedMicro;
  user.totalBets = Object.values(state.bets)
    .filter(b => b.userAddress === address && b.status === 'confirmed').length;
  user.marketIds = positions.map(p => p.contractMarketId);

  let activePredictions = 0, resolvedPredictions = 0;
  let winCount = 0, lossCount = 0, pendingClaimCount = 0;

  for (const position of positions) {
    const marketId = state.marketRefsByContractId[String(position.contractMarketId)];
    const market = marketId ? state.markets[marketId] : null;
    const status = market?.status ?? 'active';

    if (status === 'active') { activePredictions += 1; continue; }
    resolvedPredictions += 1;
    if (!position.claimed) pendingClaimCount += 1;

    if (status === 'resolved') {
      const didWin =
        (market.winningOutcome === true && position.yesAmountMicro > 0) ||
        (market.winningOutcome === false && position.noAmountMicro > 0);
      if (didWin) winCount += 1; else lossCount += 1;
    }
  }

  user.activePredictions = activePredictions;
  user.resolvedPredictions = resolvedPredictions;
  user.winCount = winCount;
  user.lossCount = lossCount;
  user.pendingClaimCount = pendingClaimCount;
}

export function buildLeaderboard(state, limit) {
  return Object.values(state.users)
    .map(user => {
      const completedMarkets = user.winCount + user.lossCount;
      const winRate = completedMarkets > 0 ? (user.winCount / completedMarkets) * 100 : 0;
      return {
        address: user.address,
        totalProfit: Number((user.totalProfitMicro / 1_000_000).toFixed(6)),
        winRate: Number(winRate.toFixed(1)),
        totalBets: user.totalBets,
      };
    })
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
