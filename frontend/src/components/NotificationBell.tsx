'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationDrawer } from './NotificationDrawer';

interface Props {
  address: string | null | undefined;
}

export function NotificationBell({ address }: Props) {
  const [open, setOpen] = useState(false);
  const { unread } = useNotifications(address);

  if (!address) return null;

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <NotificationDrawer address={address} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
