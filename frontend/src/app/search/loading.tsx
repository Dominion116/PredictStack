export default function SearchLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6 animate-pulse">
      <div className="h-10 rounded-lg bg-muted" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    </main>
  );
}
