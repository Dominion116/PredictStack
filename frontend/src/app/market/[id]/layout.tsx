import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prediction Market | PredictStack',
  description: 'Place your prediction on this market and earn STX if you are right.',
  openGraph: {
    title: 'Prediction Market | PredictStack',
    description: 'Trade shares on real-world outcomes. Built on the Stacks blockchain.',
    type: 'website',
    images: [{ url: '/og-market.png', width: 1200, height: 630, alt: 'PredictStack Market' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prediction Market | PredictStack',
    description: 'Trade shares on real-world outcomes. Built on the Stacks blockchain.',
  },
};

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
