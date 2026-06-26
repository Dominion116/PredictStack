import { sendJson, sanitizeAddress } from '../middleware/http.mjs';
import { listNotifications, markRead, markAllRead } from '../services/notification-service.mjs';

export function createNotificationRoutes() {
  return {
    /**
     * @swagger
     * /api/notifications/{address}:
     *   get:
     *     summary: List notifications for a user
     *     tags: [Notifications]
     *     parameters:
     *       - in: path
     *         name: address
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
     *         description: Paginated notifications with unread count
     *   post:
     *     summary: Mark all notifications as read
     *     tags: [Notifications]
     *     responses:
     *       200:
     *         description: All notifications marked read
     */
    async list(req, res, address, searchParams) {
      const page = Number(searchParams.get('page') || 1);
      const limit = Number(searchParams.get('limit') || 20);
      const safeAddress = sanitizeAddress(address);
      if (!safeAddress) return sendJson(res, 400, { error: 'address is required' });
      const result = await listNotifications(safeAddress, page, limit);
      return sendJson(res, 200, result);
    },

    async markOne(req, res, address, notificationId) {
      await markRead(sanitizeAddress(address), notificationId);
      return sendJson(res, 200, { success: true });
    },

    async markAll(req, res, address) {
      await markAllRead(sanitizeAddress(address));
      return sendJson(res, 200, { success: true });
    },
  };
}
