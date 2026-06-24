'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  Notification,
} from '@/api/notifications';

const POLL_INTERVAL_MS = 30_000;

export function useNotifications(address: string | null | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await getNotifications(address);
      setNotifications(data.notifications);
      setUnread(data.unread);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    if (!address) return;
    await markNotificationRead(address, id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }, [address]);

  const markAll = useCallback(async () => {
    if (!address) return;
    await markAllNotificationsRead(address);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }, [address]);

  return { notifications, unread, loading, error, markRead, markAll, refresh: fetchNotifications };
}
