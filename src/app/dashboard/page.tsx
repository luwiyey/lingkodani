
import { Users, ShieldAlert, Inbox, Sprout, Wheat, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SmsFeedPreview } from "@/components/dashboard/sms-feed-preview";
import { ResourceStatus } from "@/components/dashboard/resource-status";
import { DailySmsChart } from "@/components/dashboard/daily-sms-chart";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-8">
       <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard ng Barangay</h1>
        <p className="text-muted-foreground">Buod ng mga aktibidad at alerto sa agrikultura sa iyong nasasakupan.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Kabuuang Magsasaka"
          value="347"
          icon={Users}
          description="+5 mula noong nakaraang linggo"
          iconBgClass="bg-primary/10"
        />
        <StatCard
          title="Mga Alertong Pang-peste"
          value="3"
          icon={ShieldAlert}
          description="Mga aktibong ulat ng outbreak"
          iconBgClass="bg-destructive/10"
        />
        <StatCard
          title="Nasa Pagtatanim"
          value="142"
          icon={Sprout}
          description="Bilang ng mga sakahan sa yugto ng pagtatanim"
          iconBgClass="bg-blue-500/10"
        />
        <StatCard
          title="Nasa Paglago"
          value="115"
          icon={Wheat}
          description="Bilang ng mga sakahan sa yugto ng paglago"
          iconBgClass="bg-amber-500/10"
        />
        <StatCard
          title="Handa nang Anihin"
          value="90"
          icon={CheckCircle2}
          description="Bilang ng mga sakahan na malapit nang mag-ani"
          iconBgClass="bg-green-500/10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <SmsFeedPreview />
        </div>
        <div className="lg:col-span-3">
            <ResourceStatus />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <DailySmsChart />
      </div>

    </div>
  );
}
