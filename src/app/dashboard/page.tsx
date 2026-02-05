
import { Bot, Users, ShieldCheck, ShieldAlert, Inbox } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SmsFeedPreview } from "@/components/dashboard/sms-feed-preview";
import { ResourceStatus } from "@/components/dashboard/resource-status";
import { DailySmsChart } from "@/components/dashboard/daily-sms-chart";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-8">
       <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard ng Opisyal</h1>
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
          title="Kabuuang Kahilingan"
          value="23"
          icon={Inbox}
          description="12 binhi, 8 pataba, 3 kasangkapan"
          iconBgClass="bg-orange-500/10"
        />
        <StatCard
          title="Marka ng Tiwala sa AI"
          value="92.5%"
          icon={ShieldCheck}
          description="Katamtamang kumpiyansa ng payo"
          iconBgClass="bg-green-500/10"
        />
        <StatCard
          title="Alerto sa Peste"
          value="3"
          icon={ShieldAlert}
          description="Mga aktibong ulat ng outbreak"
          iconBgClass="bg-destructive/10"
        />
        <StatCard
          title="Mga Nakabinbing SMS"
          value="8"
          icon={Bot}
          description="Mga ulat na nangangailangan ng pagpapatunay"
          iconBgClass="bg-amber-500/10"
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
