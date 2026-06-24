import { ObjectId } from 'mongodb';
import { buildComment, validateCommentBody } from '../models/comment.mjs';

let _col = null;

export function initCommentService(col) {
  _col = col;
}

/**
 * List comments for a market, newest first, with soft-deleted bodies redacted.
 */
export async function listComments(marketId, page = 1, limit = 20) {
  if (!_col) return { comments: [], total: 0 };
  const safeLimit = Math.min(Number(limit) || 20, 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;
  const filter = { marketId: Number(marketId) };

  const [raw, total] = await Promise.all([
    _col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    _col.countDocuments(filter),
  ]);

  const comments = raw.map(c => ({
    ...c,
    body: c.deletedAt ? '[deleted]' : c.body,
  }));

  return { comments, total };
}

export async function createComment(marketId, authorAddress, body, parentId = null) {
  if (!_col) throw new Error('Comment service not initialized');
  const validation = validateCommentBody(body);
  if (!validation.ok) throw new Error(validation.error);

  const doc = buildComment(marketId, authorAddress, validation.text, parentId);
  const result = await _col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Soft-delete a comment. Only the author or an admin address may delete.
 */
export async function deleteComment(commentId, requestingAddress, adminAddresses = []) {
  if (!_col) throw new Error('Comment service not initialized');
  const oid = new ObjectId(commentId);
  const comment = await _col.findOne({ _id: oid });
  if (!comment) return { ok: false, error: 'Comment not found' };
  if (comment.deletedAt) return { ok: false, error: 'Already deleted' };

  const isAllowed =
    comment.authorAddress === requestingAddress ||
    adminAddresses.includes(requestingAddress);
  if (!isAllowed) return { ok: false, error: 'Forbidden' };

  await _col.updateOne({ _id: oid }, { $set: { deletedAt: new Date().toISOString() } });
  return { ok: true };
}
