import { Metadata } from 'next';
import { ExploreClient } from './ExploreClient';

export const metadata: Metadata = {
  title: 'Explore Markets | PredictStack',
  description: 'Discover and filter prediction markets on PredictStack. Browse by category, sort by volume or ending time, and find the best markets to bet on.',
  openGraph: {
    title: 'Explore Prediction Markets | PredictStack',
    description: 'Browse all active and resolved prediction markets on the Stacks blockchain.',
    type: 'website',
  },
};

export default function ExplorePage() {
  return <ExploreClient />;
}
