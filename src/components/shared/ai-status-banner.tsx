import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

type AiStatusBannerProps = {
  title: string;
  description: string;
  className?: string;
};

export function AiStatusBanner({ title, description, className }: AiStatusBannerProps) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-border bg-card px-4 py-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-accent p-2 text-primary">
          <Info className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
