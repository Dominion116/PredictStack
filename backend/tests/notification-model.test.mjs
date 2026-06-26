import { describe, it, expect } from 'vitest';
import { buildNotification, NOTIFICATION_TYPES } from '../models/notification.mjs';

describe('NOTIFICATION_TYPES', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(NOTIFICATION_TYPES)).toBe(true);
  });

  it('has the three expected types', () => {
    expect(NOTIFICATION_TYPES.BET_CONFIRMED).toBe('bet_confirmed');
    expect(NOTIFICATION_TYPES.MARKET_RESOLVED).toBe('market_resolved');
    expect(NOTIFICATION_TYPES.CLAIM_AVAILABLE).toBe('claim_available');
  });
});

describe('buildNotification', () => {
  it('creates a notification with required fields', () => {
    const n = buildNotification('SP1ABC', NOTIFICATION_TYPES.BET_CONFIRMED, 'Bet confirmed', 'Your bet was placed.', 1);
    expect(n.recipientAddress).toBe('SP1ABC');
    expect(n.type).toBe('bet_confirmed');
    expect(n.title).toBe('Bet confirmed');
    expect(n.body).toBe('Your bet was placed.');
    expect(n.marketId).toBe(1);
    expect(n.read).toBe(false);
    expect(n.createdAt).toBeTruthy();
  });

  it('defaults marketId to null when not provided', () => {
    const n = buildNotification('SP1', 'bet_confirmed', 'title', 'body');
    expect(n.marketId).toBeNull();
  });

  it('sets read to false by default', () => {
    const n = buildNotification('SP1', 'bet_confirmed', 't', 'b');
    expect(n.read).toBe(false);
  });

  it('coerces marketId to number', () => {
    const n = buildNotification('SP1', 'bet_confirmed', 't', 'b', '5');
    expect(n.marketId).toBe(5);
  });

  it('coerces recipientAddress to string', () => {
    const n = buildNotification(123, 'bet_confirmed', 't', 'b');
    expect(n.recipientAddress).toBe('123');
  });
});
