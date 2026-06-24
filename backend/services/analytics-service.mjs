/**
 * Analytics service — aggregates per-user P&L history, rolling win-rate,
 * and category breakdown from the in-memory store for the /analytics endpoint.
 *
 * No separate collection is used: data is derived on-request from bets,
 * positions, and markets already held in the store.
 */

/**
 * Build a daily cumulative P&L series for a user.
 * Each point: { date: 'YYYY-MM-DD', cumulativeProfitMicro: number }
 */
function buildPnlSeries(bets, positions, markets) {
  const dailyMap = {};

  for (const bet of bets) {
    if (bet.status !== 'confirmed') continue;
    const day = bet.createdAt.slice(0, 10);
    dailyMap[day] ??= 0;
    dailyMap[day] -= bet.amountMicro; // cost
  }

  for (const pos of Object.values(positions)) {
    if (!pos.claimed || !pos.claimableAmountMicro) continue;
    const market = markets[pos.marketId];
    const day = market?.updatedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    dailyMap[day] ??= 0;
    dailyMap[day] += pos.claimableAmountMicro; // proceeds
  }

  const days = Object.keys(dailyMap).sort();
  let cumulative = 0;
  return days.map(date => {
    cumulative += dailyMap[date];
    return { date, cumulativeProfitMicro: cumulative };
  });
}

/**
 * Compute win-rate stats.
 * Returns { totalBets, wins, losses, winRate }
 */
function buildWinRateStats(bets, positions, markets) {
  let wins = 0;
  let losses = 0;

  for (const pos of Object.values(positions)) {
    const market = markets[pos.marketId];
    if (!market || market.status !== 'resolved') continue;
    const betOnYes = pos.yesAmountMicro > 0;
    const betOnNo = pos.noAmountMicro > 0;
    const won =
      (betOnYes && market.winningOutcome === true) ||
      (betOnNo && market.winningOutcome === false);
    if (won) wins++;
    else losses++;
  }

  const total = wins + losses;
  return {
    totalBets: bets.filter(b => b.status === 'confirmed').length,
    resolvedBets: total,
    wins,
    losses,
    winRate: total > 0 ? Math.round((wins / total) * 10000) / 100 : 0,
  };
}

/**
 * Break bets down by market category.
 * Returns [{ category, count, totalMicro }]
 */
function buildCategoryBreakdown(bets, markets) {
  const map = {};
  for (const bet of bets) {
    if (bet.status !== 'confirmed') continue;
    const market = markets[bet.marketId];
    const category = market?.category ?? 'General';
    map[category] ??= { category, count: 0, totalMicro: 0 };
    map[category].count++;
    map[category].totalMicro += bet.amountMicro;
  }
  return Object.values(map).sort((a, b) => b.totalMicro - a.totalMicro);
}

/**
 * Main entry point used by the analytics route.
 * @param {object} state - full store state
 * @param {string} address - user STX address
 * @returns {object}
 */
export function getUserAnalytics(state, address) {
  const userBets = Object.values(state.bets ?? {}).filter(b => b.userAddress === address);
  const userPositions = state.positions?.[address] ?? {};

  return {
    pnlSeries: buildPnlSeries(userBets, userPositions, state.markets ?? {}),
    winRate: buildWinRateStats(userBets, userPositions, state.markets ?? {}),
    categoryBreakdown: buildCategoryBreakdown(userBets, state.markets ?? {}),
  };
}
