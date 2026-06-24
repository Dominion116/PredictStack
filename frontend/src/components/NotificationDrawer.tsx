'use client';

import { useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationItem } from './NotificationItem';
import { Bell, X } from 'lucide-react';

interface Props {
  address: string | null | undefined;
  open: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ address, open, onClose }: Props) {
  const { notifications, unread, loading, markRead, markAll } = useNotifications(address);
  const ref = useRef<HTMLDivElement>(null);

  // Mark all read when drawer opens
  useEffect(() => {
    if (open && unread > 0) markAll();
  }, [open, unread, markAll]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 w-80 max-h-[480px] overflow-y-auto rounded-xl border border-border bg-background shadow-xl z-50 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="text-sm font-semibold">Notifications</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-2 flex-1">
        {loading && notifications.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Loading…</p>
        )}
        {!loading && notifications.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No notifications yet.</p>
        )}
        {notifications.map(n => (
          <NotificationItem key={n._id} notification={n} onMarkRead={markRead} />
        ))}
      </div>
    </div>
  );
}
