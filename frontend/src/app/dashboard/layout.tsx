import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | PredictStack',
  description: 'View your prediction market portfolio, active positions, win rate, and claim your winnings on PredictStack.',
  openGraph: {
    title: 'My Dashboard | PredictStack',
    description: 'Track your active and resolved prediction market positions on the Stacks blockchain.',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
