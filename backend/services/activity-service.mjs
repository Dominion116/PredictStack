import { buildActivity, ACTIVITY_TYPES } from '../models/activity.mjs';

let _col = null;

/**
 * Call once during server startup with the MongoDB collection reference.
 * @param {import('mongodb').Collection} col
 */
export function initActivityService(col) {
  _col = col;
}

/**
 * Insert an activity event into the activities collection.
 * Silently swallows errors so a failed write never breaks the primary request.
 */
async function emit(type, actorAddress, marketId, marketQuestion, meta) {
  if (!_col) return;
  try {
    await _col.insertOne(buildActivity(type, actorAddress, marketId, marketQuestion, meta));
  } catch (err) {
    console.error('[activity-service] emit failed:', err.message);
  }
}

export function emitBetPlaced(actorAddress, marketId, marketQuestion, amountMicro, outcome) {
  return emit(
    ACTIVITY_TYPES.BET_PLACED,
    actorAddress,
    marketId,
    marketQuestion,
    { amountMicro, outcome },
  );
}

export function emitMarketCreated(actorAddress, marketId, marketQuestion) {
  return emit(
    ACTIVITY_TYPES.MARKET_CREATED,
    actorAddress,
    marketId,
    marketQuestion,
    {},
  );
}

export function emitMarketResolved(actorAddress, marketId, marketQuestion, winningOutcome) {
  return emit(
    ACTIVITY_TYPES.MARKET_RESOLVED,
    actorAddress,
    marketId,
    marketQuestion,
    { winningOutcome },
  );
}

export function emitClaimMade(actorAddress, marketId, marketQuestion, amountMicro, claimType) {
  return emit(
    ACTIVITY_TYPES.CLAIM_MADE,
    actorAddress,
    marketId,
    marketQuestion,
    { amountMicro, claimType },
  );
}

/**
 * Fetch a page of recent activity events.
 * @param {number} page - 1-based page number
 * @param {number} limit - items per page (max 50)
 * @returns {Promise<{ activities: object[], total: number }>}
 */
export async function getActivityFeed(page = 1, limit = 20) {
  if (!_col) return { activities: [], total: 0 };
  const safeLimit = Math.min(Number(limit) || 20, 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const [activities, total] = await Promise.all([
    _col.find({}).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    _col.countDocuments({}),
  ]);

  return { activities, total };
}
