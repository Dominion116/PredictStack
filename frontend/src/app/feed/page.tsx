import { ActivityFeed } from '@/components/ActivityFeed';

export const metadata = {
  title: 'Activity Feed — PredictStack',
  description: 'Live stream of bets placed, markets created, and outcomes resolved on PredictStack.',
};

export default function FeedPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Live stream of bets, market creations, resolutions, and claims.
        </p>
      </div>
      <ActivityFeed limit={20} />
    </main>
  );
}
