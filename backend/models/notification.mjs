/**
 * Notification model — stored in `notifications` MongoDB collection.
 *
 * Schema:
 *   _id           — MongoDB ObjectId (auto)
 *   recipientAddress — STX address of the user who receives the notification
 *   type          — 'bet_confirmed' | 'market_resolved' | 'claim_available'
 *   title         — short headline
 *   body          — human-readable message
 *   marketId      — contractMarketId (number) the notification relates to, or null
 *   read          — boolean, false until the user opens the drawer
 *   createdAt     — ISO 8601 timestamp
 */

export const NOTIFICATION_TYPES = Object.freeze({
  BET_CONFIRMED: 'bet_confirmed',
  MARKET_RESOLVED: 'market_resolved',
  CLAIM_AVAILABLE: 'claim_available',
});

export function buildNotification(recipientAddress, type, title, body, marketId = null) {
  return {
    recipientAddress: String(recipientAddress),
    type,
    title: String(title),
    body: String(body),
    marketId: marketId != null ? Number(marketId) : null,
    read: false,
    createdAt: new Date().toISOString(),
  };
}
