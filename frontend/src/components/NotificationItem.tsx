'use client';

import { Notification } from '@/api/notifications';

const TYPE_ICONS: Record<string, string> = {
  bet_confirmed: '🎯',
  market_resolved: '✅',
  claim_available: '💰',
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: Props) {
  const icon = TYPE_ICONS[notification.type] ?? '🔔';

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${!notification.read ? 'bg-primary/5 border border-primary/10' : ''}`}
      onClick={() => !notification.read && onMarkRead(notification._id)}
    >
      <span className="text-lg mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{notification.body}</p>
        <time className="text-[10px] text-muted-foreground mt-1 block">{relativeTime(notification.createdAt)}</time>
      </div>
      {!notification.read && (
        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </div>
  );
}
