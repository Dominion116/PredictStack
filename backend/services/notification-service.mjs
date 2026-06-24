import { ObjectId } from 'mongodb';
import { buildNotification, NOTIFICATION_TYPES } from '../models/notification.mjs';

let _col = null;

export function initNotificationService(col) {
  _col = col;
}

async function emit(recipientAddress, type, title, body, marketId) {
  if (!_col || !recipientAddress) return;
  try {
    await _col.insertOne(buildNotification(recipientAddress, type, title, body, marketId));
  } catch (err) {
    console.error('[notification-service] emit failed:', err.message);
  }
}

export function notifyBetConfirmed(address, marketQuestion, contractMarketId) {
  return emit(
    address,
    NOTIFICATION_TYPES.BET_CONFIRMED,
    'Bet confirmed',
    `Your bet on "${marketQuestion}" was placed successfully.`,
    contractMarketId,
  );
}

export function notifyMarketResolved(address, marketQuestion, contractMarketId, winningOutcome) {
  return emit(
    address,
    NOTIFICATION_TYPES.MARKET_RESOLVED,
    'Market resolved',
    `"${marketQuestion}" resolved ${winningOutcome ? 'YES' : 'NO'}.`,
    contractMarketId,
  );
}

export function notifyClaimAvailable(address, marketQuestion, contractMarketId) {
  return emit(
    address,
    NOTIFICATION_TYPES.CLAIM_AVAILABLE,
    'Claim available',
    `You can now claim your winnings from "${marketQuestion}".`,
    contractMarketId,
  );
}

export async function listNotifications(address, page = 1, limit = 20) {
  if (!_col) return { notifications: [], total: 0, unread: 0 };
  const filter = { recipientAddress: address };
  const safeLimit = Math.min(Number(limit) || 20, 50);
  const skip = (Math.max(Number(page), 1) - 1) * safeLimit;

  const [notifications, total, unread] = await Promise.all([
    _col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    _col.countDocuments(filter),
    _col.countDocuments({ ...filter, read: false }),
  ]);

  return { notifications, total, unread };
}

export async function markRead(address, notificationId) {
  if (!_col) return;
  await _col.updateOne(
    { _id: new ObjectId(notificationId), recipientAddress: address },
    { $set: { read: true } },
  );
}

export async function markAllRead(address) {
  if (!_col) return;
  await _col.updateMany({ recipientAddress: address, read: false }, { $set: { read: true } });
}
