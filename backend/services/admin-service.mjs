import { buildAuditEntry } from '../models/audit-log.mjs';

let _col = null;

export function initAdminService(col) {
  _col = col;
}

export async function logAudit(action, actorAddress, targetId, details = {}) {
  if (!_col) return;
  try {
    await _col.insertOne(buildAuditEntry(action, actorAddress, targetId, details));
  } catch (err) {
    console.error('[admin-service] audit log failed:', err.message);
  }
}

export async function getAuditLog(page = 1, limit = 20) {
  if (!_col) return { entries: [], total: 0 };
  const safeLimit = Math.min(Number(limit) || 20, 50);
  const skip = (Math.max(Number(page), 1) - 1) * safeLimit;
  const [entries, total] = await Promise.all([
    _col.find({}).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    _col.countDocuments({}),
  ]);
  return { entries, total };
}

/**
 * Compute 7-day rolling stats from the store state.
 */
export function computeAdminStats(state) {
  const now = Date.now();
  const DAY_MS = 86_400_000;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - i * DAY_MS);
    return d.toISOString().slice(0, 10);
  }).reverse();

  const betsByDay = {};
  const volumeByDay = {};
  const usersByDay = {};

  for (const bet of Object.values(state.bets ?? {})) {
    if (bet.status !== 'confirmed') continue;
    const day = bet.createdAt?.slice(0, 10);
    if (!day) continue;
    betsByDay[day] = (betsByDay[day] ?? 0) + 1;
    volumeByDay[day] = (volumeByDay[day] ?? 0) + bet.amountMicro;
  }

  for (const user of Object.values(state.users ?? {})) {
    const day = user.joinedAt?.slice(0, 10);
    if (!day) continue;
    usersByDay[day] = (usersByDay[day] ?? 0) + 1;
  }

  return {
    days: days.map(day => ({
      date: day,
      bets: betsByDay[day] ?? 0,
      volumeMicro: volumeByDay[day] ?? 0,
      newUsers: usersByDay[day] ?? 0,
    })),
  };
}
