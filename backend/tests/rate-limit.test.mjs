import { describe, it, expect, beforeEach } from 'vitest';
import { createRateLimiter } from '../middleware/rate-limit.mjs';

describe('createRateLimiter', () => {
  let limiter;

  beforeEach(() => {
    limiter = createRateLimiter({ windowMs: 60_000, max: 3 });
  });

  it('allows requests up to max', () => {
    expect(limiter.allow('SP1')).toBe(true);
    expect(limiter.allow('SP1')).toBe(true);
    expect(limiter.allow('SP1')).toBe(true);
  });

  it('blocks requests exceeding max', () => {
    limiter.allow('SP1');
    limiter.allow('SP1');
    limiter.allow('SP1');
    expect(limiter.allow('SP1')).toBe(false);
  });

  it('tracks different keys independently', () => {
    limiter.allow('SP1');
    limiter.allow('SP1');
    limiter.allow('SP1');
    // SP2 should still be allowed
    expect(limiter.allow('SP2')).toBe(true);
  });

  it('returns correct remaining count', () => {
    limiter.allow('SP1');
    expect(limiter.remaining('SP1')).toBe(2);
    limiter.allow('SP1');
    expect(limiter.remaining('SP1')).toBe(1);
  });

  it('reset clears all counters', () => {
    limiter.allow('SP1');
    limiter.allow('SP1');
    limiter.allow('SP1');
    limiter.reset();
    expect(limiter.allow('SP1')).toBe(true);
  });

  it('returns max remaining for unknown key', () => {
    expect(limiter.remaining('SP_NEW')).toBe(3);
  });

  it('coerces key to string', () => {
    expect(limiter.allow(123)).toBe(true);
    expect(limiter.allow('123')).toBe(true); // same key, now 2 hits
    expect(limiter.remaining('123')).toBe(1);
  });
});
