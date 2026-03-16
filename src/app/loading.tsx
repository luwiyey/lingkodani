import Image from "next/image";

export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#eef6f0_0%,#f6f8f6_48%,#ffffff_100%)] px-4">
      <div className="w-full max-w-sm rounded-[calc(var(--radius)+12px)] border border-border/80 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Image
            src="/logo.png"
            width={40}
            height={40}
            alt="Lingkod-Ani Logo"
            className="h-10 w-10"
            priority
          />
        </div>
        <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-foreground">
          Lingkod-Ani
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inihahanda ang agricultural advisory workspace.
        </p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/70" />
        </div>
      </div>
    </div>
  );
}
