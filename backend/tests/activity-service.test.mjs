import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildActivity, ACTIVITY_TYPES } from '../models/activity.mjs';
import { initActivityService, emitBetPlaced, emitMarketCreated, emitMarketResolved, emitClaimMade, getActivityFeed } from '../services/activity-service.mjs';

function makeMockCol() {
  const docs = [];
  return {
    docs,
    insertOne: vi.fn(async doc => { docs.push(doc); return { insertedId: 'mock-id' }; }),
    find: vi.fn(() => ({
      sort: () => ({ skip: () => ({ limit: () => ({ toArray: async () => docs }) }) }),
    })),
    countDocuments: vi.fn(async () => docs.length),
  };
}

describe('buildActivity', () => {
  it('creates a document with required fields', () => {
    const doc = buildActivity(ACTIVITY_TYPES.BET_PLACED, 'SP1ABC', 1, 'Will BTC hit 100k?', { amountMicro: 50000 });
    expect(doc.type).toBe('bet_placed');
    expect(doc.actorAddress).toBe('SP1ABC');
    expect(doc.marketId).toBe(1);
    expect(doc.marketQuestion).toBe('Will BTC hit 100k?');
    expect(doc.meta.amountMicro).toBe(50000);
    expect(doc.createdAt).toBeTruthy();
  });

  it('defaults marketId to null when not provided', () => {
    const doc = buildActivity(ACTIVITY_TYPES.MARKET_CREATED, 'SP1ABC', null, 'test');
    expect(doc.marketId).toBeNull();
  });
});

describe('ACTIVITY_TYPES', () => {
  it('contains all expected event types', () => {
    expect(ACTIVITY_TYPES.BET_PLACED).toBe('bet_placed');
    expect(ACTIVITY_TYPES.MARKET_CREATED).toBe('market_created');
    expect(ACTIVITY_TYPES.MARKET_RESOLVED).toBe('market_resolved');
    expect(ACTIVITY_TYPES.CLAIM_MADE).toBe('claim_made');
  });

  it('is frozen', () => {
    expect(Object.isFrozen(ACTIVITY_TYPES)).toBe(true);
  });
});

describe('activity-service emit helpers', () => {
  let col;

  beforeEach(() => {
    col = makeMockCol();
    initActivityService(col);
  });

  it('emitBetPlaced inserts a bet_placed document', async () => {
    await emitBetPlaced('SP1ABC', 1, 'Will BTC hit 100k?', 50000, true);
    expect(col.insertOne).toHaveBeenCalledOnce();
    const [doc] = col.docs;
    expect(doc.type).toBe('bet_placed');
    expect(doc.meta.outcome).toBe(true);
  });

  it('emitMarketCreated inserts a market_created document', async () => {
    await emitMarketCreated('SP1ABC', 2, 'Will ETH flip BTC?');
    expect(col.insertOne).toHaveBeenCalledOnce();
    expect(col.docs[0].type).toBe('market_created');
  });

  it('emitMarketResolved inserts a market_resolved document with winningOutcome', async () => {
    await emitMarketResolved('SP1ADMIN', 3, 'Will BTC hit 100k?', true);
    const doc = col.docs[0];
    expect(doc.type).toBe('market_resolved');
    expect(doc.meta.winningOutcome).toBe(true);
  });

  it('emitClaimMade inserts a claim_made document', async () => {
    await emitClaimMade('SP1ABC', 1, 'Test market', 150000, 'winnings');
    const doc = col.docs[0];
    expect(doc.type).toBe('claim_made');
    expect(doc.meta.amountMicro).toBe(150000);
    expect(doc.meta.claimType).toBe('winnings');
  });

  it('does not throw when col is null (silent failure)', async () => {
    initActivityService(null);
    await expect(emitBetPlaced('SP1ABC', 1, 'test', 1000, true)).resolves.toBeUndefined();
  });
});

describe('getActivityFeed', () => {
  it('returns empty result when not initialized', async () => {
    initActivityService(null);
    const result = await getActivityFeed();
    expect(result).toEqual({ activities: [], total: 0 });
  });

  it('returns paginated activities', async () => {
    const col = makeMockCol();
    initActivityService(col);
    await emitBetPlaced('SP1ABC', 1, 'test', 1000, true);
    const result = await getActivityFeed(1, 10);
    expect(result.activities).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('caps limit at 50', async () => {
    const col = makeMockCol();
    initActivityService(col);
    await getActivityFeed(1, 999);
    expect(col.find).toHaveBeenCalled();
  });
});
