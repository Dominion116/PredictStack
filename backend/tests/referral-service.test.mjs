import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initReferralService, getOrCreateReferral, getReferralStats, creditReferral, findByCode } from '../services/referral-service.mjs';

function makeMockCol(initialDocs = []) {
  const docs = [...initialDocs];
  return {
    docs,
    findOne: vi.fn(async filter => {
      if (filter.referrerAddress) return docs.find(d => d.referrerAddress === filter.referrerAddress) ?? null;
      if (filter.code) return docs.find(d => d.code === filter.code) ?? null;
      return null;
    }),
    insertOne: vi.fn(async doc => {
      docs.push(doc);
      return { insertedId: 'mock-id' };
    }),
    updateOne: vi.fn(async () => {}),
  };
}

describe('getOrCreateReferral', () => {
  it('returns existing referral if address already has one', async () => {
    const existing = { referrerAddress: 'SP1ABC', code: 'ABCD1234', referredAddresses: [], totalRewardsMicro: 0 };
    const col = makeMockCol([existing]);
    initReferralService(col);
    const result = await getOrCreateReferral('SP1ABC');
    expect(result.code).toBe('ABCD1234');
    expect(col.insertOne).not.toHaveBeenCalled();
  });

  it('creates a new referral for a new address', async () => {
    const col = makeMockCol();
    initReferralService(col);
    const result = await getOrCreateReferral('SP2XYZ');
    expect(result.referrerAddress).toBe('SP2XYZ');
    expect(result.code).toHaveLength(8);
    expect(col.insertOne).toHaveBeenCalledOnce();
  });

  it('throws when service is not initialized', async () => {
    initReferralService(null);
    await expect(getOrCreateReferral('SP1ABC')).rejects.toThrow(/not initialized/i);
  });
});

describe('getReferralStats', () => {
  it('returns null for unknown address', async () => {
    initReferralService(makeMockCol());
    const result = await getReferralStats('SP_UNKNOWN');
    expect(result).toBeNull();
  });

  it('returns the referral document for a known address', async () => {
    const col = makeMockCol([{ referrerAddress: 'SP1ABC', code: 'CODE1234', referredAddresses: ['SP2'], totalRewardsMicro: 1000 }]);
    initReferralService(col);
    const result = await getReferralStats('SP1ABC');
    expect(result.code).toBe('CODE1234');
    expect(result.totalRewardsMicro).toBe(1000);
  });
});

describe('findByCode', () => {
  it('returns null when service is uninitialized', async () => {
    initReferralService(null);
    const result = await findByCode('ABCD1234');
    expect(result).toBeNull();
  });

  it('uppercases the code before lookup', async () => {
    const col = makeMockCol([{ referrerAddress: 'SP1', code: 'ABCD1234', referredAddresses: [] }]);
    initReferralService(col);
    const result = await findByCode('abcd1234');
    expect(result?.code).toBe('ABCD1234');
  });
});
