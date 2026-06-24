import { backendFetch } from './client';

export interface Notification {
  _id: string;
  recipientAddress: string;
  type: 'bet_confirmed' | 'market_resolved' | 'claim_available';
  title: string;
  body: string;
  marketId: number | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unread: number;
}

export async function getNotifications(address: string, page = 1, limit = 20): Promise<NotificationsResponse> {
  return backendFetch<NotificationsResponse>(`/api/notifications/${address}?page=${page}&limit=${limit}`);
}

export async function markNotificationRead(address: string, notificationId: string): Promise<void> {
  await backendFetch(`/api/notifications/${address}/read/${notificationId}`, { method: 'POST' });
}

export async function markAllNotificationsRead(address: string): Promise<void> {
  await backendFetch(`/api/notifications/${address}`, { method: 'POST' });
}
