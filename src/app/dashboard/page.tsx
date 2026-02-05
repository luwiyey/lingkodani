import { Bot, Users, ShieldCheck, ShieldAlert } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SmsFeedPreview } from "@/components/dashboard/sms-feed-preview";
import { ResourceStatus } from "@/components/dashboard/resource-status";
import { DailySmsChart } from "@/components/dashboard/daily-sms-chart";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Kabuuang Magsasaka"
          value="342"
          icon={Users}
          description="+20 mula noong nakaraang buwan"
          iconBgClass="bg-primary/10"
        />
        <StatCard
          title="Marka ng Tiwala sa AI"
          value="92.5%"
          icon={ShieldCheck}
          description="Katamtamang kumpiyansa ng naaprubahang payo"
          iconBgClass="bg-green-500/10"
        />
        <StatCard
          title="Minarkahang Mataas ang Panganib"
          value="3"
          icon={ShieldAlert}
          description="Payo na may <60% kumpiyansa"
          iconBgClass="bg-destructive/10"
        />
        <StatCard
          title="Mga Nakabinbing Aksyon"
          value="8"
          icon={Bot}
          description="Mga ulat sa SMS na nangangailangan ng pagpapatunay"
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
