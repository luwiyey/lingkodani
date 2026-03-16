import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  iconBgClass?: string;
  iconColorClass?: string;
};

export function StatCard({ title, value, icon: Icon, description, iconBgClass, iconColorClass }: StatCardProps) {
  return (
    <Card className="h-full min-h-[104px] hover:-translate-y-px hover:border-primary/15">
      <CardContent className="flex h-full items-start justify-between gap-4 p-5">
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-muted-foreground">{title}</p>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
          {description && <p className="text-xs leading-5 text-muted-foreground">{description}</p>}
        </div>
        <div className={cn("p-2 rounded-md", iconBgClass || "bg-primary/10")}>
            <Icon className={cn("h-4 w-4", iconColorClass || "text-primary")} />
        </div>
      </CardContent>
    </Card>
  );
}
