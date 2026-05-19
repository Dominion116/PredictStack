import { Metadata } from 'next';
import { ExploreClient } from './ExploreClient';

export const metadata: Metadata = {
  title: 'Explore Markets | PredictStack',
  description: 'Discover prediction markets — filter by status, date, and sort by volume or ending time.',
};

export default function ExplorePage() {
  return <ExploreClient />;
}
