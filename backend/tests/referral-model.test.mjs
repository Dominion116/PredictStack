import { describe, it, expect } from 'vitest';
import { generateReferralCode, buildReferral } from '../models/referral.mjs';

describe('generateReferralCode', () => {
  it('returns an 8-character uppercase hex string', () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[0-9A-F]{8}$/);
  });

  it('generates unique codes on repeated calls', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateReferralCode()));
    expect(codes.size).toBeGreaterThan(90);
  });
});

describe('buildReferral', () => {
  it('creates a referral document with all required fields', () => {
    const doc = buildReferral('SP1ABC');
    expect(doc.referrerAddress).toBe('SP1ABC');
    expect(doc.code).toHaveLength(8);
    expect(doc.referredAddresses).toEqual([]);
    expect(doc.totalRewardsMicro).toBe(0);
    expect(doc.createdAt).toBeTruthy();
  });

  it('generates a unique code per referral', () => {
    const r1 = buildReferral('SP1');
    const r2 = buildReferral('SP2');
    expect(r1.code).not.toBe(r2.code);
  });
});
