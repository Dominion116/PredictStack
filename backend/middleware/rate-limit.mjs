/**
 * Simple in-memory rate limiter using a sliding-window counter.
 * Not distributed — resets on server restart. For production, replace with Redis.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });
 *   if (!limiter.allow(req)) return sendJson(res, 429, { error: 'Too many requests' });
 */

export function createRateLimiter({ windowMs = 60_000, max = 60 } = {}) {
  const hits = new Map(); // key -> [timestamp, ...]

  function pruneWindow(key) {
    const cutoff = Date.now() - windowMs;
    const timestamps = hits.get(key) ?? [];
    const pruned = timestamps.filter(t => t > cutoff);
    if (pruned.length === 0) hits.delete(key);
    else hits.set(key, pruned);
    return pruned;
  }

  return {
    /**
     * Returns true if the request is allowed, false if rate-limited.
     * @param {string} key - typically the IP address or STX address
     */
    allow(key) {
      const current = pruneWindow(String(key));
      if (current.length >= max) return false;
      current.push(Date.now());
      hits.set(String(key), current);
      return true;
    },

    /**
     * Returns remaining requests in the current window for a key.
     * @param {string} key
     */
    remaining(key) {
      const current = pruneWindow(String(key));
      return Math.max(0, max - current.length);
    },

    /** Clear all counters (useful in tests). */
    reset() {
      hits.clear();
    },
  };
}

/** Shared write-path limiter — 30 requests per minute per IP. */
export const writeLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });
