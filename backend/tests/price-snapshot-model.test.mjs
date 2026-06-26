import { describe, it, expect } from 'vitest';
import { buildSnapshot } from '../models/price-snapshot.mjs';

describe('buildSnapshot', () => {
  it('creates a snapshot with marketId, yes, no, and timestamp', () => {
    const snap = buildSnapshot(1, 5500, 4500);
    expect(snap.marketId).toBe(1);
    expect(snap.yes).toBe(5500);
    expect(snap.no).toBe(4500);
    expect(typeof snap.timestamp).toBe('number');
    expect(snap.timestamp).toBeGreaterThan(0);
  });

  it('coerces values to numbers', () => {
    const snap = buildSnapshot('3', '6000', '4000');
    expect(snap.marketId).toBe(3);
    expect(snap.yes).toBe(6000);
    expect(snap.no).toBe(4000);
  });

  it('timestamp is close to Date.now()', () => {
    const before = Date.now();
    const snap = buildSnapshot(1, 5000, 5000);
    const after = Date.now();
    expect(snap.timestamp).toBeGreaterThanOrEqual(before);
    expect(snap.timestamp).toBeLessThanOrEqual(after);
  });
});
