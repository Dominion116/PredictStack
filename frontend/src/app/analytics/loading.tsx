export default function AnalyticsLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="h-40 rounded-xl bg-muted" />
      ))}
    </main>
  );
}
