import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Markets | PredictStack',
  description: 'Browse all prediction markets on PredictStack. Find active markets, place bets, and track outcomes on the Stacks blockchain.',
  openGraph: {
    title: 'All Prediction Markets | PredictStack',
    description: 'Browse and bet on prediction markets powered by the Stacks blockchain.',
    type: 'website',
  },
};

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
