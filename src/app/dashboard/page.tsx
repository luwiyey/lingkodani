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
          title="Total Farmers"
          value="342"
          icon={Users}
          description="+20 since last month"
          iconBgClass="bg-primary/10"
        />
        <StatCard
          title="AI Trust Score"
          value="92.5%"
          icon={ShieldCheck}
          description="Avg. confidence of approved advice"
          iconBgClass="bg-green-500/10"
        />
        <StatCard
          title="Flagged High-Risk"
          value="3"
          icon={ShieldAlert}
          description="Advice with <60% confidence"
          iconBgClass="bg-destructive/10"
        />
        <StatCard
          title="Pending Actions"
          value="8"
          icon={Bot}
          description="SMS reports needing validation"
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
