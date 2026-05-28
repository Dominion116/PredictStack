import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard | PredictStack',
  description: 'See the top prediction market traders on PredictStack ranked by total profit, win rate, and number of bets placed.',
  openGraph: {
    title: 'Top Predictors Leaderboard | PredictStack',
    description: 'Rankings of the best prediction market traders on the Stacks blockchain.',
    type: 'website',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
