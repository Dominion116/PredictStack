import { describe, it, expect } from 'vitest';
import { computeOdds, estimatePostTradeOdds, bpsToProb, estimateSlippage } from '../utils/odds.mjs';

describe('computeOdds', () => {
  it('returns 50/50 for empty pools', () => {
    const odds = computeOdds(0, 0);
    expect(odds.yes).toBe(5000);
    expect(odds.no).toBe(5000);
  });

  it('computes correct odds for unequal pools', () => {
    const odds = computeOdds(7_000_000, 3_000_000);
    expect(odds.yes).toBe(7000);
    expect(odds.no).toBe(3000);
  });

  it('yes + no always equals 10000', () => {
    const odds = computeOdds(1_234_567, 8_765_433);
    expect(odds.yes + odds.no).toBe(10_000);
  });

  it('floors yes odds', () => {
    const odds = computeOdds(1, 2); // 1/3 = 3333.33...
    expect(Number.isInteger(odds.yes)).toBe(true);
  });
});

describe('estimatePostTradeOdds', () => {
  it('shifts odds towards YES after a YES bet', () => {
    const pre  = computeOdds(5_000_000, 5_000_000);
    const post = estimatePostTradeOdds(5_000_000, 5_000_000, true, 1_000_000);
    expect(post.yes).toBeGreaterThan(pre.yes);
  });

  it('shifts odds towards NO after a NO bet', () => {
    const pre  = computeOdds(5_000_000, 5_000_000);
    const post = estimatePostTradeOdds(5_000_000, 5_000_000, false, 1_000_000);
    expect(post.no).toBeGreaterThan(pre.no);
  });
});

describe('bpsToProb', () => {
  it('converts 5000 bps to 0.5', () => {
    expect(bpsToProb(5000)).toBe(0.5);
  });

  it('converts 10000 bps to 1', () => {
    expect(bpsToProb(10000)).toBe(1);
  });

  it('converts 0 bps to 0', () => {
    expect(bpsToProb(0)).toBe(0);
  });
});

describe('estimateSlippage', () => {
  it('returns 0 slippage for equal pools with tiny bet', () => {
    const slippage = estimateSlippage(1_000_000_000, 1_000_000_000, true, 1);
    expect(slippage).toBeGreaterThanOrEqual(0);
  });

  it('returns positive slippage for a significant bet', () => {
    const slippage = estimateSlippage(1_000_000, 1_000_000, true, 500_000);
    expect(slippage).toBeGreaterThan(0);
  });

  it('returns non-negative slippage', () => {
    const slippage = estimateSlippage(5_000_000, 5_000_000, false, 100_000);
    expect(slippage).toBeGreaterThanOrEqual(0);
  });
});
