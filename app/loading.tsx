export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-xs text-muted-foreground font-medium tracking-wide">Loading WVW Intelligence…</p>
      </div>
    </div>
  );
}
