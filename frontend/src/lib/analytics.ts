type EventName =
  | 'bet_initiated'
  | 'bet_confirmed'
  | 'bet_cancelled'
  | 'claim_initiated'
  | 'claim_confirmed'
  | 'market_viewed'
  | 'wallet_connected'
  | 'wallet_disconnected'
  | 'search_performed'
  | 'filter_applied';

interface EventProperties {
  marketId?: number;
  outcome?: 'YES' | 'NO';
  amountMicro?: number;
  category?: string;
  query?: string;
  [key: string]: unknown;
}

export function trackEvent(name: EventName, properties?: EventProperties): void {
  if (process.env.NODE_ENV !== 'production') return;
  // Wire up to your analytics provider here (e.g. Mixpanel, PostHog, Amplitude)
  console.debug('[analytics]', name, properties);
}
