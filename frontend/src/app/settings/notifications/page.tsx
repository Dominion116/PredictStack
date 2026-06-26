'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { isUserSignedIn, getUserAddress } from '@/lib/constants';

const NOTIFICATION_PREFS_KEY = 'predictstack-notification-prefs';

const PREF_ITEMS = [
  { key: 'bet_confirmed', label: 'Bet Confirmed', description: 'When your bet is successfully placed on-chain' },
  { key: 'market_resolved', label: 'Market Resolved', description: 'When a market you bet on is resolved' },
  { key: 'claim_available', label: 'Claim Available', description: 'When you have winnings or a refund to claim' },
];

function loadPrefs(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATION_PREFS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function savePrefs(prefs: Record<string, boolean>) {
  localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const saved = loadPrefs();
    return PREF_ITEMS.reduce((acc, item) => ({
      ...acc,
      [item.key]: saved[item.key] ?? true,
    }), {} as Record<string, boolean>);
  });

  if (!isUserSignedIn()) {
    return (
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Connect your wallet to manage notification preferences.</p>
      </main>
    );
  }

  function toggle(key: string) {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      savePrefs(next);
      return next;
    });
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Notification Preferences</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose which in-app notifications you receive.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {PREF_ITEMS.map(item => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
          >
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={prefs[item.key]}
              onClick={() => toggle(item.key)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${prefs[item.key] ? 'bg-primary' : 'bg-muted'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${prefs[item.key] ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Preferences are stored locally in your browser. Notifications are delivered in-app via the bell icon in the navbar.
      </p>
    </main>
  );
}
