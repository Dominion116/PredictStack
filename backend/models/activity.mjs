/**
 * Activity model — each document represents one observable platform event.
 *
 * Events are stored in a separate MongoDB collection (`activities`) so the
 * main store document does not grow unboundedly.
 *
 * Schema:
 *   _id        — MongoDB ObjectId (auto)
 *   type       — 'bet_placed' | 'market_created' | 'market_resolved' | 'claim_made'
 *   actorAddress — STX address of the user who triggered the event
 *   marketId   — contractMarketId (number) the event relates to
 *   marketQuestion — denormalised question string for display without a join
 *   meta       — type-specific payload (amountMicro, outcome, winningOutcome, …)
 *   createdAt  — ISO 8601 timestamp
 */

export const ACTIVITY_TYPES = Object.freeze({
  BET_PLACED: 'bet_placed',
  MARKET_CREATED: 'market_created',
  MARKET_RESOLVED: 'market_resolved',
  CLAIM_MADE: 'claim_made',
});

/**
 * Build a ready-to-insert activity document.
 * @param {string} type - One of ACTIVITY_TYPES values
 * @param {string} actorAddress - STX address
 * @param {number|null} marketId - contractMarketId
 * @param {string} marketQuestion - Human-readable market question
 * @param {object} meta - Event-specific payload
 * @returns {object}
 */
export function buildActivity(type, actorAddress, marketId, marketQuestion, meta = {}) {
  return {
    type,
    actorAddress,
    marketId: marketId ?? null,
    marketQuestion: marketQuestion ?? '',
    meta,
    createdAt: new Date().toISOString(),
  };
}
