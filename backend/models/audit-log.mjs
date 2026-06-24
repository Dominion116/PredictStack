/**
 * Audit log model — stored in `audit_log` MongoDB collection.
 * Records admin actions: market creation, resolution, bulk operations.
 *
 * Schema:
 *   _id        — MongoDB ObjectId (auto)
 *   action     — 'market_created' | 'market_resolved' | 'market_cancelled' | 'bulk_resolved'
 *   actorAddress — admin STX address
 *   targetId   — market ref or contract market ID affected
 *   details    — additional context (outcome, count, etc.)
 *   createdAt  — ISO 8601 timestamp
 */

export function buildAuditEntry(action, actorAddress, targetId, details = {}) {
  return {
    action: String(action),
    actorAddress: String(actorAddress),
    targetId: targetId != null ? String(targetId) : null,
    details,
    createdAt: new Date().toISOString(),
  };
}
