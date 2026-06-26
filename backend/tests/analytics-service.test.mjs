import { describe, it, expect } from 'vitest';
import { getUserAnalytics } from '../services/analytics-service.mjs';

function makeState(overrides = {}) {
  return {
    bets: {},
    positions: {},
    markets: {},
    users: {},
    ...overrides,
  };
}

describe('getUserAnalytics', () => {
  it('returns empty series for user with no bets', () => {
    const result = getUserAnalytics(makeState(), 'SP1ABC');
    expect(result.pnlSeries).toEqual([]);
    expect(result.categoryBreakdown).toEqual([]);
    expect(result.winRate.totalBets).toBe(0);
    expect(result.winRate.wins).toBe(0);
    expect(result.winRate.losses).toBe(0);
    expect(result.winRate.winRate).toBe(0);
  });

  it('includes confirmed bets in P&L series', () => {
    const state = makeState({
      bets: {
        'b1': {
          id: 'b1',
          userAddress: 'SP1ABC',
          marketId: 'market-1',
          contractMarketId: 1,
          amountMicro: 50000,
          outcome: true,
          status: 'confirmed',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      },
    });
    const result = getUserAnalytics(state, 'SP1ABC');
    expect(result.pnlSeries).toHaveLength(1);
    expect(result.pnlSeries[0].cumulativeProfitMicro).toBe(-50000);
  });

  it('excludes non-confirmed bets from P&L', () => {
    const state = makeState({
      bets: {
        'b1': {
          id: 'b1',
          userAddress: 'SP1ABC',
          marketId: 'market-1',
          contractMarketId: 1,
          amountMicro: 50000,
          outcome: true,
          status: 'intent',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      },
    });
    const result = getUserAnalytics(state, 'SP1ABC');
    expect(result.pnlSeries).toHaveLength(0);
  });

  it('counts wins and losses from resolved positions', () => {
    const state = makeState({
      bets: {
        'b1': { id: 'b1', userAddress: 'SP1ABC', marketId: 'mkt-1', contractMarketId: 1, amountMicro: 50000, outcome: true, status: 'confirmed', createdAt: '2025-01-01T00:00:00.000Z' },
        'b2': { id: 'b2', userAddress: 'SP1ABC', marketId: 'mkt-2', contractMarketId: 2, amountMicro: 50000, outcome: false, status: 'confirmed', createdAt: '2025-01-02T00:00:00.000Z' },
      },
      positions: {
        'SP1ABC': {
          '1': { userAddress: 'SP1ABC', marketId: 'mkt-1', contractMarketId: 1, yesAmountMicro: 50000, noAmountMicro: 0, claimed: false },
          '2': { userAddress: 'SP1ABC', marketId: 'mkt-2', contractMarketId: 2, yesAmountMicro: 0, noAmountMicro: 50000, claimed: false },
        },
      },
      markets: {
        'mkt-1': { id: 'mkt-1', contractMarketId: 1, status: 'resolved', winningOutcome: true, category: 'Crypto', updatedAt: '2025-01-10T00:00:00.000Z' },
        'mkt-2': { id: 'mkt-2', contractMarketId: 2, status: 'resolved', winningOutcome: true, category: 'Sports', updatedAt: '2025-01-11T00:00:00.000Z' },
      },
    });

    const result = getUserAnalytics(state, 'SP1ABC');
    expect(result.winRate.wins).toBe(1);
    expect(result.winRate.losses).toBe(1);
    expect(result.winRate.winRate).toBe(50);
  });

  it('builds category breakdown sorted by totalMicro', () => {
    const state = makeState({
      bets: {
        'b1': { id: 'b1', userAddress: 'SP1ABC', marketId: 'mkt-1', contractMarketId: 1, amountMicro: 100000, outcome: true, status: 'confirmed', createdAt: '2025-01-01T00:00:00.000Z' },
        'b2': { id: 'b2', userAddress: 'SP1ABC', marketId: 'mkt-1', contractMarketId: 1, amountMicro: 50000, outcome: false, status: 'confirmed', createdAt: '2025-01-02T00:00:00.000Z' },
        'b3': { id: 'b3', userAddress: 'SP1ABC', marketId: 'mkt-2', contractMarketId: 2, amountMicro: 20000, outcome: true, status: 'confirmed', createdAt: '2025-01-03T00:00:00.000Z' },
      },
      markets: {
        'mkt-1': { id: 'mkt-1', contractMarketId: 1, category: 'Crypto', status: 'active' },
        'mkt-2': { id: 'mkt-2', contractMarketId: 2, category: 'Sports', status: 'active' },
      },
    });

    const result = getUserAnalytics(state, 'SP1ABC');
    expect(result.categoryBreakdown[0].category).toBe('Crypto');
    expect(result.categoryBreakdown[0].totalMicro).toBe(150000);
    expect(result.categoryBreakdown[1].category).toBe('Sports');
    expect(result.categoryBreakdown[1].totalMicro).toBe(20000);
  });
});
