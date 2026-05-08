export default function PlatformLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted/60 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-muted rounded-xl" />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="section-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-12 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted/60 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main content card */}
      <div className="section-card">
        <div className="section-card-header">
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="divide-y divide-border">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-2/5" />
                <div className="h-3 bg-muted/60 rounded w-1/4" />
              </div>
              <div className="h-6 w-16 bg-muted rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
