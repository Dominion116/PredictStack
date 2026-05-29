import { describe, it, expect } from 'vitest';
import {
  formatMicroSTX,
  formatVolume,
  formatProbability,
  calculateOdds,
  truncateAddress,
  formatWinRate,
  isMarketActive,
  getMarketStatus,
  parseMarketCategory,
} from './format';

describe('formatMicroSTX', () => {
  it('formats small amounts with 4 decimals', () => {
    expect(formatMicroSTX(1_000_000)).toBe('1.0000 STX');
  });
  it('formats thousands with k suffix', () => {
    expect(formatMicroSTX(5_000_000_000)).toBe('5.00k STX');
  });
  it('formats millions with M suffix', () => {
    expect(formatMicroSTX(2_000_000_000_000)).toBe('2.00M STX');
  });
});

describe('formatVolume', () => {
  it('formats small amounts as integer STX', () => {
    expect(formatVolume(100_000)).toBe('0');
  });
  it('formats thousands with k suffix', () => {
    expect(formatVolume(1_500_000_000)).toBe('1.5k');
  });
});

describe('formatProbability', () => {
  it('returns 50% when both pools are equal', () => {
    expect(formatProbability(100, 100)).toBe('50%');
  });
  it('returns 50% when total is zero', () => {
    expect(formatProbability(0, 0)).toBe('50%');
  });
  it('returns correct percentage', () => {
    expect(formatProbability(75, 25)).toBe('75%');
  });
});

describe('calculateOdds', () => {
  it('returns 0 when winning pool is zero', () => {
    expect(calculateOdds(50_000, 0, 100_000)).toBe(0);
  });
  it('calculates correct projected payout', () => {
    expect(calculateOdds(50_000, 100_000, 50_000)).toBe(75_000);
  });
});

describe('truncateAddress', () => {
  it('truncates long addresses', () => {
    expect(truncateAddress('ST1ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe('ST1ABC...WXYZ');
  });
  it('returns short addresses unchanged', () => {
    expect(truncateAddress('ST1AB')).toBe('ST1AB');
  });
});

describe('formatWinRate', () => {
  it('returns dash when no bets', () => {
    expect(formatWinRate(0, 0)).toBe('—');
  });
  it('calculates correct percentage', () => {
    expect(formatWinRate(3, 1)).toBe('75%');
  });
});

describe('isMarketActive', () => {
  it('returns true for active status', () => {
    expect(isMarketActive('active')).toBe(true);
  });
  it('returns false for resolved status', () => {
    expect(isMarketActive('resolved')).toBe(false);
  });
});

describe('getMarketStatus', () => {
  it('maps known statuses', () => {
    expect(getMarketStatus('active')).toBe('active');
    expect(getMarketStatus('resolved')).toBe('resolved');
    expect(getMarketStatus('cancelled')).toBe('cancelled');
  });
  it('returns unknown for unrecognized status', () => {
    expect(getMarketStatus('pending')).toBe('unknown');
  });
});

describe('parseMarketCategory', () => {
  it('returns known category as-is', () => {
    expect(parseMarketCategory('crypto')).toBe('crypto');
  });
  it('is case-insensitive', () => {
    expect(parseMarketCategory('SPORTS')).toBe('sports');
  });
  it('falls back to other for unknown', () => {
    expect(parseMarketCategory('xyz')).toBe('other');
  });
  it('handles null/undefined', () => {
    expect(parseMarketCategory(null)).toBe('other');
    expect(parseMarketCategory(undefined)).toBe('other');
  });
});
