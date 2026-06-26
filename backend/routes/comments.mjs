import { sendJson, readBody, sanitizeAddress } from '../middleware/http.mjs';
import { requireAddress, rejectInvalid } from '../middleware/validate.mjs';
import { writeLimiter } from '../middleware/rate-limit.mjs';
import {
  listComments,
  createComment,
  deleteComment,
} from '../services/comment-service.mjs';

export function createCommentRoutes({ config }) {
  const adminAddresses = config.ADMIN_ADDRESSES ? config.ADMIN_ADDRESSES.split(',').map(a => a.trim()) : [];

  return {
    /**
     * @swagger
     * /api/markets/{id}/comments:
     *   get:
     *     summary: List comments for a market
     *     tags: [Comments]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *       - in: query
     *         name: page
     *         schema: { type: integer, default: 1 }
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 20 }
     *     responses:
     *       200:
     *         description: Paginated comment list
     *   post:
     *     summary: Post a new comment on a market
     *     tags: [Comments]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [authorAddress, body]
     *             properties:
     *               authorAddress: { type: string }
     *               body: { type: string, maxLength: 500 }
     *               parentId: { type: string, nullable: true }
     *     responses:
     *       201:
     *         description: Comment created
     *       400:
     *         description: Validation error
     */
    async list(req, res, marketId, searchParams) {
      const page = Number(searchParams.get('page') || 1);
      const limit = Number(searchParams.get('limit') || 20);
      const { comments, total } = await listComments(marketId, page, limit);
      return sendJson(res, 200, { comments, total, page, limit });
    },

    async create(req, res, marketId) {
      const body = await readBody(req);
      if (rejectInvalid(res, requireAddress(body.authorAddress, 'authorAddress'))) return;
      const authorAddress = sanitizeAddress(body.authorAddress);
      if (!writeLimiter.allow(authorAddress)) {
        return sendJson(res, 429, { error: 'Too many comments — please slow down' });
      }

      try {
        const comment = await createComment(marketId, authorAddress, body.body, body.parentId ?? null);
        return sendJson(res, 201, { comment });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    },

    async remove(req, res, marketId, commentId) {
      const body = await readBody(req);
      if (rejectInvalid(res, requireAddress(body.requestingAddress, 'requestingAddress'))) return;
      const requestingAddress = sanitizeAddress(body.requestingAddress);

      const result = await deleteComment(commentId, requestingAddress, adminAddresses);
      if (!result.ok) {
        const status = result.error === 'Forbidden' ? 403 : result.error === 'Comment not found' ? 404 : 400;
        return sendJson(res, status, { error: result.error });
      }
      return sendJson(res, 200, { success: true });
    },
  };
}
