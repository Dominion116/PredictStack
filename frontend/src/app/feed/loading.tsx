export default function FeedLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8 space-y-2">
        <div className="h-7 w-36 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-3 border-b border-border animate-pulse">
            <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="h-3 bg-muted rounded w-12" />
          </div>
        ))}
      </div>
    </main>
  );
}
