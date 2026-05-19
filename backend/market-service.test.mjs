import { describe, it, expect } from 'vitest';
import { fetchPlatformConfig } from './services/market-service.mjs';

describe('market-service', () => {
  it('fetches platform config', async () => {
    const cfg = await fetchPlatformConfig({});
    expect(cfg.minBet).toBe(20000);
  });
});
