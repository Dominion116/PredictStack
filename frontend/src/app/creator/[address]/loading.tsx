export default function CreatorLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-3 w-48 bg-muted rounded" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-muted" />)}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-muted" />)}
      </div>
    </main>
  );
}
