import { sendJson, sanitizeAddress } from '../middleware/http.mjs';
import { listNotifications, markRead, markAllRead } from '../services/notification-service.mjs';

export function createNotificationRoutes() {
  return {
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
