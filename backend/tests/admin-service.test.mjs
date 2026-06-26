import { describe, it, expect, vi } from 'vitest';
import { initAdminService, logAudit, getAuditLog, computeAdminStats } from '../services/admin-service.mjs';

function makeMockCol(initialDocs = []) {
  const docs = [...initialDocs];
  return {
    docs,
    insertOne: vi.fn(async doc => { docs.push(doc); return { insertedId: 'mock' }; }),
    find: vi.fn(() => ({
      sort: () => ({ skip: () => ({ limit: () => ({ toArray: async () => [...docs] }) }) }),
    })),
    countDocuments: vi.fn(async () => docs.length),
  };
}

describe('logAudit', () => {
  it('inserts an audit entry', async () => {
    const col = makeMockCol();
    initAdminService(col);
    await logAudit('market_created', 'SP1ADMIN', 'my-market', { question: 'test' });
    expect(col.insertOne).toHaveBeenCalledOnce();
    const doc = col.docs[0];
    expect(doc.action).toBe('market_created');
    expect(doc.actorAddress).toBe('SP1ADMIN');
    expect(doc.targetId).toBe('my-market');
    expect(doc.details.question).toBe('test');
  });

  it('does not throw when uninitialized', async () => {
    initAdminService(null);
    await expect(logAudit('test', 'addr', 'id')).resolves.toBeUndefined();
  });
});

describe('getAuditLog', () => {
  it('returns empty when uninitialized', async () => {
    initAdminService(null);
    const result = await getAuditLog();
    expect(result).toEqual({ entries: [], total: 0 });
  });

  it('returns entries from the collection', async () => {
    const col = makeMockCol([
      { action: 'market_created', actorAddress: 'SP1', targetId: 'mkt-1', details: {}, createdAt: new Date().toISOString() },
    ]);
    initAdminService(col);
    const result = await getAuditLog(1, 20);
    expect(result.entries).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

describe('computeAdminStats', () => {
  it('returns 7 days in the result', () => {
    const result = computeAdminStats({ bets: {}, users: {} });
    expect(result.days).toHaveLength(7);
  });

  it('sums confirmed bet volume per day', () => {
    const today = new Date().toISOString().slice(0, 10);
    const state = {
      bets: {
        b1: { status: 'confirmed', amountMicro: 100000, createdAt: `${today}T10:00:00.000Z`, userAddress: 'SP1' },
        b2: { status: 'confirmed', amountMicro: 50000, createdAt: `${today}T11:00:00.000Z`, userAddress: 'SP1' },
        b3: { status: 'intent', amountMicro: 200000, createdAt: `${today}T12:00:00.000Z`, userAddress: 'SP1' },
      },
      users: {},
    };
    const result = computeAdminStats(state);
    const todayEntry = result.days.find(d => d.date === today);
    expect(todayEntry?.volumeMicro).toBe(150000);
    expect(todayEntry?.bets).toBe(2);
  });

  it('counts new users per day', () => {
    const today = new Date().toISOString().slice(0, 10);
    const state = {
      bets: {},
      users: {
        u1: { joinedAt: `${today}T09:00:00.000Z` },
        u2: { joinedAt: `${today}T10:00:00.000Z` },
      },
    };
    const result = computeAdminStats(state);
    const todayEntry = result.days.find(d => d.date === today);
    expect(todayEntry?.newUsers).toBe(2);
  });

  it('returns zero values for days with no activity', () => {
    const result = computeAdminStats({ bets: {}, users: {} });
    for (const day of result.days) {
      expect(day.bets).toBe(0);
      expect(day.volumeMicro).toBe(0);
      expect(day.newUsers).toBe(0);
    }
  });
});
