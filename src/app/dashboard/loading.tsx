function LoadingBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        <LoadingBlock className="h-9 w-64" />
        <LoadingBlock className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LoadingBlock className="h-28 w-full border border-border/60 bg-card" />
        <LoadingBlock className="h-28 w-full border border-border/60 bg-card" />
        <LoadingBlock className="h-28 w-full border border-border/60 bg-card" />
        <LoadingBlock className="h-28 w-full border border-border/60 bg-card" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <LoadingBlock className="h-[520px] w-full border border-border/60 bg-card" />
        <LoadingBlock className="h-[520px] w-full border border-border/60 bg-card" />
        <LoadingBlock className="h-[520px] w-full border border-border/60 bg-card" />
      </div>
    </div>
  );
}
