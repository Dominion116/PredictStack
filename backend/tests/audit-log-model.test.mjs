import { describe, it, expect } from 'vitest';
import { buildAuditEntry } from '../models/audit-log.mjs';

describe('buildAuditEntry', () => {
  it('creates an audit entry with all fields', () => {
    const entry = buildAuditEntry('market_created', 'SP1ADMIN', 'market-ref-1', { contractMarketId: 1 });
    expect(entry.action).toBe('market_created');
    expect(entry.actorAddress).toBe('SP1ADMIN');
    expect(entry.targetId).toBe('market-ref-1');
    expect(entry.details.contractMarketId).toBe(1);
    expect(entry.createdAt).toBeTruthy();
  });

  it('defaults details to empty object', () => {
    const entry = buildAuditEntry('market_resolved', 'SP1', 'ref');
    expect(entry.details).toEqual({});
  });

  it('converts targetId to string', () => {
    const entry = buildAuditEntry('test', 'SP1', 42);
    expect(entry.targetId).toBe('42');
  });

  it('sets targetId to null when not provided', () => {
    const entry = buildAuditEntry('test', 'SP1', null);
    expect(entry.targetId).toBeNull();
  });

  it('coerces action and actorAddress to string', () => {
    const entry = buildAuditEntry(123, 456, 'ref');
    expect(entry.action).toBe('123');
    expect(entry.actorAddress).toBe('456');
  });
});
