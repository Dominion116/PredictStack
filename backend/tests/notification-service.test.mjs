import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initNotificationService,
  notifyBetConfirmed,
  notifyMarketResolved,
  notifyClaimAvailable,
  listNotifications,
  markRead,
  markAllRead,
} from '../services/notification-service.mjs';

function makeMockCol(initialDocs = []) {
  const docs = [...initialDocs];
  return {
    docs,
    insertOne: vi.fn(async doc => { docs.push(doc); return { insertedId: 'mock' }; }),
    find: vi.fn(() => ({
      sort: () => ({ skip: () => ({ limit: () => ({ toArray: async () => [...docs] }) }) }),
    })),
    countDocuments: vi.fn(async filter => {
      if (filter?.read === false) return docs.filter(d => !d.read).length;
      return docs.length;
    }),
    updateOne: vi.fn(async (filter, update) => {
      const doc = docs.find(d => d._id?.toString() === filter._id?.toString());
      if (doc && update.$set) Object.assign(doc, update.$set);
    }),
    updateMany: vi.fn(async (filter, update) => {
      docs.filter(d => !d.read).forEach(d => Object.assign(d, update.$set));
    }),
  };
}

describe('notifyBetConfirmed', () => {
  it('inserts a bet_confirmed notification', async () => {
    const col = makeMockCol();
    initNotificationService(col);
    await notifyBetConfirmed('SP1ABC', 'Will BTC hit 100k?', 1);
    expect(col.insertOne).toHaveBeenCalledOnce();
    expect(col.docs[0].type).toBe('bet_confirmed');
    expect(col.docs[0].recipientAddress).toBe('SP1ABC');
  });

  it('does not throw when service is uninitialized', async () => {
    initNotificationService(null);
    await expect(notifyBetConfirmed('SP1', 'test', 1)).resolves.toBeUndefined();
  });
});

describe('notifyMarketResolved', () => {
  it('inserts a market_resolved notification with YES outcome', async () => {
    const col = makeMockCol();
    initNotificationService(col);
    await notifyMarketResolved('SP1ABC', 'Will ETH flip BTC?', 2, true);
    const doc = col.docs[0];
    expect(doc.type).toBe('market_resolved');
    expect(doc.body).toMatch(/YES/);
  });

  it('includes NO in body when outcome is false', async () => {
    const col = makeMockCol();
    initNotificationService(col);
    await notifyMarketResolved('SP1ABC', 'Test market', 3, false);
    expect(col.docs[0].body).toMatch(/NO/);
  });
});

describe('notifyClaimAvailable', () => {
  it('inserts a claim_available notification', async () => {
    const col = makeMockCol();
    initNotificationService(col);
    await notifyClaimAvailable('SP1ABC', 'Test market', 1);
    expect(col.docs[0].type).toBe('claim_available');
  });
});

describe('listNotifications', () => {
  it('returns empty when uninitialized', async () => {
    initNotificationService(null);
    const result = await listNotifications('SP1ABC');
    expect(result).toEqual({ notifications: [], total: 0, unread: 0 });
  });

  it('returns notifications and correct unread count', async () => {
    const col = makeMockCol([
      { _id: '1', recipientAddress: 'SP1ABC', type: 'bet_confirmed', title: 't', body: 'b', read: false, createdAt: new Date().toISOString() },
      { _id: '2', recipientAddress: 'SP1ABC', type: 'market_resolved', title: 't', body: 'b', read: true, createdAt: new Date().toISOString() },
    ]);
    initNotificationService(col);
    const result = await listNotifications('SP1ABC');
    expect(result.total).toBe(2);
    expect(result.unread).toBe(1);
  });
});

describe('markAllRead', () => {
  it('calls updateMany on the collection', async () => {
    const col = makeMockCol();
    initNotificationService(col);
    await markAllRead('SP1ABC');
    expect(col.updateMany).toHaveBeenCalledOnce();
  });
});
