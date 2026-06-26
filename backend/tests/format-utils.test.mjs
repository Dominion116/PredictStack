import { describe, it, expect } from 'vitest';
import { microToStx, stxToMicro, bpsToPercent, shortAddress, isoToMs, startOfDay } from '../utils/format.mjs';

describe('microToStx', () => {
  it('converts micro to STX with default 6 decimals', () => {
    expect(microToStx(1_000_000)).toBe('1.000000');
    expect(microToStx(50_000)).toBe('0.050000');
    expect(microToStx(0)).toBe('0.000000');
  });

  it('respects custom decimal places', () => {
    expect(microToStx(1_500_000, 2)).toBe('1.50');
  });

  it('handles string input', () => {
    expect(microToStx('2000000')).toBe('2.000000');
  });
});

describe('stxToMicro', () => {
  it('converts STX to microSTX', () => {
    expect(stxToMicro(1)).toBe(1_000_000);
    expect(stxToMicro(0.5)).toBe(500_000);
    expect(stxToMicro(0.02)).toBe(20_000);
  });

  it('rounds to integer', () => {
    expect(Number.isInteger(stxToMicro(0.123456789))).toBe(true);
  });
});

describe('bpsToPercent', () => {
  it('formats 5000 bps as 50.00%', () => {
    expect(bpsToPercent(5000)).toBe('50.00%');
  });

  it('formats 10000 bps as 100.00%', () => {
    expect(bpsToPercent(10000)).toBe('100.00%');
  });

  it('respects custom decimal places', () => {
    expect(bpsToPercent(3333, 1)).toBe('33.3%');
  });
});

describe('shortAddress', () => {
  it('shortens a long address', () => {
    const result = shortAddress('SP1ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
    expect(result).toContain('…');
    expect(result.startsWith('SP1ABC')).toBe(true);
  });

  it('returns address as-is if short', () => {
    expect(shortAddress('SP1')).toBe('SP1');
  });

  it('handles null/undefined gracefully', () => {
    expect(shortAddress(null)).toBe('');
  });
});

describe('isoToMs', () => {
  it('converts ISO string to epoch ms', () => {
    const ms = isoToMs('2025-01-01T00:00:00.000Z');
    expect(ms).toBe(new Date('2025-01-01T00:00:00.000Z').getTime());
  });
});

describe('startOfDay', () => {
  it('returns midnight UTC for a given date', () => {
    const result = startOfDay('2025-06-15T14:30:00.000Z');
    expect(result).toContain('2025-06-15T00:00:00.000Z');
  });
});
