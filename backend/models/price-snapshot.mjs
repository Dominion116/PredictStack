/**
 * Price snapshot model — stored in `price_snapshots` MongoDB collection.
 * Recorded by the cron job every 5 minutes for all active markets.
 *
 * Schema:
 *   marketId   — contractMarketId (number)
 *   yes        — YES odds in basis points (0–10000)
 *   no         — NO odds in basis points (0–10000)
 *   timestamp  — Unix epoch ms
 */

export function buildSnapshot(marketId, yes, no) {
  return {
    marketId: Number(marketId),
    yes: Number(yes),
    no: Number(no),
    timestamp: Date.now(),
  };
}
