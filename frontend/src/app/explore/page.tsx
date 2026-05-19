import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Markets | PredictStack',
  description: 'Discover prediction markets',
};

'use client';
import { useSearchParams } from 'next/navigation';

export default function ExplorePage() {
  const params = useSearchParams();
  // sync filters logic, trending/ending
  return <div>Explore Markets (filters synced) + trending/ending</div>;
}
