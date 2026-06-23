/**
 * Comment model — per-market user comments stored in `comments` collection.
 *
 * Schema:
 *   _id          — MongoDB ObjectId (auto)
 *   marketId     — contractMarketId (number) the comment belongs to
 *   authorAddress — STX address of the commenter
 *   body         — comment text (max 500 chars)
 *   parentId     — ObjectId string of the parent comment for 1-level threading, or null
 *   deletedAt    — ISO string if soft-deleted, null otherwise
 *   createdAt    — ISO 8601 timestamp
 *   updatedAt    — ISO 8601 timestamp
 */

const MAX_BODY_LENGTH = 500;

export function validateCommentBody(body) {
  const text = String(body ?? '').trim();
  if (!text) return { ok: false, error: 'Comment body is required' };
  if (text.length > MAX_BODY_LENGTH) {
    return { ok: false, error: `Comment must be ${MAX_BODY_LENGTH} characters or fewer` };
  }
  return { ok: true, text };
}

export function buildComment(marketId, authorAddress, body, parentId = null) {
  const now = new Date().toISOString();
  return {
    marketId: Number(marketId),
    authorAddress: String(authorAddress),
    body: String(body).trim(),
    parentId: parentId ? String(parentId) : null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
