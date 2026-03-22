'use client';

import { useState } from 'react';
import Link from "next/link";
import {
  Archive,
  Clock3,
  ClipboardList,
  ShieldAlert,
  Sprout,
  UserPlus,
  Users,
  Wind,
  Droplets,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { SmsFeedPreview } from "@/components/dashboard/sms-feed-preview";
import { ResourceStatus } from "@/components/dashboard/resource-status";
import { DailySmsChart } from "@/components/dashboard/daily-sms-chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpDialog } from "@/components/ui/help-dialog";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { WeeklyInquiriesSummary } from '@/components/dashboard/weekly-inquiries-summary';
import { useData } from '@/context/data-context';
import { useAnalytics, type RiskAlert } from '@/hooks/use-analytics';
import { isLiveMode } from '@/lib/config/app-mode';

const alertIconMap = {
  flood: Wind,
  pest: ShieldAlert,
  inventory: Droplets,
} as const;

function PriorityTaskCard({
  href,
  icon: Icon,
  iconClassName,
  value,
  label,
  tooltip,
}: {
  href: string;
  icon: typeof UserPlus;
  iconClassName: string;
  value: number;
  label: string;
  tooltip: string;
}) {
  return (
    <HoverTooltip text={tooltip}>
      <Link href={href} className="block">
        <div className="flex h-full items-center gap-4 rounded-[calc(var(--radius)+2px)] border border-border/90 bg-card p-5 shadow-sm transition-all duration-150 ease-out hover:-translate-y-px hover:border-primary/15 hover:bg-muted/35">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
            <Icon className={`h-5 w-5 ${iconClassName}`} />
          </div>
          <div>
            <p className="text-[28px] font-semibold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </Link>
    </HoverTooltip>
  );
}

export default function DashboardPage() {
  const { farmers, smsMessages, resources, broadcastAlert } = useData();
  const { riskAlerts } = useAnalytics();
  const { toast } = useToast();

  const approvedFarmersCount = farmers.filter((farmer) => farmer.status === 'active' || farmer.status === 'inactive').length;
  const activeFarmsCount = farmers.filter((farmer) => farmer.status === 'active').length;
  const activeIssuesCount = smsMessages.filter((message) => message.status === 'pending_approval' && message.urgency === 'high').length;

  const pendingFarmersCount = farmers.filter((farmer) => farmer.status === 'pending_approval').length;
  const highUrgencySmsCount = smsMessages.filter((message) => message.urgency === 'high' && message.status === 'pending_approval').length;
  const criticalAlertsCount = riskAlerts.filter((alert) => alert.severity === 'Kritikal').length;
  const lowStockCount = resources.filter((resource) => resource.stock < 10).length;

  const [confirmingAlert, setConfirmingAlert] = useState<RiskAlert | null>(null);

  const handleSendNotification = async () => {
    if (!confirmingAlert) {
      return;
    }

    const recommendation = confirmingAlert.kind === 'flood'
      ? 'I-secure ang taniman at linisin ang daluyan ng tubig habang hinihintay ang susunod na update.'
      : confirmingAlert.kind === 'pest'
        ? 'Magsagawa ng inspeksyon sa loob ng 24 oras at makipag-ugnayan sa barangay kung lumalala ang infestation.'
        : 'Makipag-ugnayan sa barangay hall kung kailangan ng alternatibong supply o mas maagang resource release.';

    try {
      const entry = await broadcastAlert({
        title: confirmingAlert.title,
        type: confirmingAlert.kind,
        severity: confirmingAlert.severity === 'Kritikal' ? 'Critical' : 'Warning',
        message: `${confirmingAlert.title}: ${confirmingAlert.description}`,
        recommendation,
        source: 'risk_center',
      });

      toast({
        title: "Abiso Ipinadala!",
        description: `Matagumpay na naipadala ang alerto sa ${entry.sentCount} na magsasaka.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Hindi naipadala ang alerto",
        description: "May problem sa pag-broadcast ng barangay alert.",
        variant: "destructive",
      });
    } finally {
      setConfirmingAlert(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <div className="flex items-center">
            <h1 className="text-[28px] font-semibold tracking-tight">Dashboard ng Barangay</h1>
            <HelpDialog title="Dashboard ng Barangay" tooltipText="Tingnan ang buod ng mga aktibidad at alerto.">
              <p>Ito ang iyong pangunahing command center. Dito mo makikita ang mabilis na pangkalahatang-ideya ng mga farmer records, SMS reports, at alerto sa iyong barangay.</p>
              <p>Ang mga stat card at task card sa ibaba ay direktang nagdadala sa tamang page para mas mabilis ang galaw sa araw-araw.</p>
              <p>Ang SMS preview, resource status, at weekly charts ay nananatiling nasa dating pamilyar na ayos para hindi magmukhang ibang system.</p>
            </HelpDialog>
          </div>
          <p className="text-sm text-muted-foreground">Buod ng mga aktibidad at alerto sa agrikultura sa iyong nasasakupan.</p>
        </div>

        {isLiveMode ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    Live automation status
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Automatic checks now run through deployed daily cron routes on the current hosting setup, with manual rerun controls still available for staff.
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild className="sm:shrink-0">
                <Link href="/dashboard/settings">
                  Buksan ang Automation Controls
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HoverTooltip text="Tingnan ang lahat ng aprubadong magsasaka sa iyong database.">
            <Link href="/dashboard/farmers">
              <StatCard
                title="Kabuuang Magsasaka"
                value={String(approvedFarmersCount)}
                icon={Users}
                description="Lahat ng aprubadong magsasaka sa database."
                iconBgClass="bg-primary/10"
                iconColorClass="text-primary"
              />
            </Link>
          </HoverTooltip>
          <HoverTooltip text="Tingnan ang bilang ng mga aktibong sakahan.">
            <Link href="/dashboard/active-farms">
              <StatCard
                title="Aktibong Sakahan"
                value={String(activeFarmsCount)}
                icon={Sprout}
                description="Mga sakahan na may kasalukuyang aktibidad."
                iconBgClass="bg-secondary/15"
                iconColorClass="text-primary"
              />
            </Link>
          </HoverTooltip>
          <HoverTooltip text="Tingnan ang mga ulat na nangangailangan ng agarang aksyon.">
            <Link href="/dashboard/active-issues">
              <StatCard
                title="May Aktibong Isyu"
                value={String(activeIssuesCount)}
                icon={ShieldAlert}
                description="Mga ulat na nangangailangan ng agarang aksyon."
                iconBgClass="bg-destructive/10"
                iconColorClass="text-destructive"
              />
            </Link>
          </HoverTooltip>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">Mga Prayoridad na Gawain</CardTitle>
            <CardDescription>Mga mahahalagang item na nangangailangan ng iyong agarang atensyon.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PriorityTaskCard
              href="/dashboard/farmers/approvals"
              icon={UserPlus}
              iconClassName="text-accent"
              value={pendingFarmersCount}
              label="Nakabinbing Pag-apruba"
              tooltip="Pumunta sa pahina ng pag-apruba para suriin ang mga bagong magsasaka."
            />
            <PriorityTaskCard
              href="/dashboard/sms-feed"
              icon={ClipboardList}
              iconClassName="text-primary"
              value={highUrgencySmsCount}
              label="Urgent na SMS"
              tooltip="Pumunta sa SMS feed upang tugunan ang mga urgent na mensahe."
            />
            <PriorityTaskCard
              href="#risk-center"
              icon={ShieldAlert}
              iconClassName="text-red-500"
              value={criticalAlertsCount}
              label="Kritikal na Alerto"
              tooltip="Suriin ang mga kritikal na alerto sa panganib sa dashboard."
            />
            <PriorityTaskCard
              href="/dashboard/inventory"
              icon={Archive}
              iconClassName="text-primary"
              value={lowStockCount}
              label="Mababang Stock"
              tooltip="Pumunta sa imbentaryo upang pamahalaan ang mga suplay."
            />
          </CardContent>
        </Card>

        <Card className="border-destructive/20" id="risk-center">
          <CardHeader className="flex flex-wrap flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center">
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <ShieldAlert />
                  Sentro ng Panganib at Alerto ng Barangay
                </CardTitle>
                <HelpDialog title="Sentro ng Panganib at Alerto" tooltipText="Unawain ang mga awtomatikong nabuong alerto.">
                  <p>Ang seksyon na ito ay ang iyong early warning system. Awtomatiko nitong sinusuri ang mga papasok na data mula sa SMS at risk signals upang makita ang mga posibleng panganib.</p>
                  <p>Bawat card ay kumakatawan sa isang aktibong alerto. Makikita rito ang uri ng panganib, paglalarawan, at dami ng maaaring maapektuhang magsasaka.</p>
                  <p><strong>Magpadala ng Abiso:</strong> Pindutin ito upang mag-broadcast ng babala sa mga apektadong magsasaka.</p>
                </HelpDialog>
              </div>
              <CardDescription>Mga awtomatikong nabuong alerto batay sa data ng panahon at mga ulat sa bukid.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {riskAlerts.map((alert) => {
              const Icon = alertIconMap[alert.kind];

              return (
                <Card key={alert.id} className="flex flex-col hover:-translate-y-px hover:border-destructive/20">
                  <CardHeader className="flex-row items-start gap-4 space-y-0">
                    <div className="rounded-xl bg-destructive/10 p-2.5">
                      <Icon className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{alert.title}</CardTitle>
                      <CardDescription>{alert.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-end gap-4">
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant={alert.severity === 'Kritikal' ? 'destructive' : 'secondary'}>{alert.severity}</Badge>
                      <span className="text-muted-foreground">{alert.affected} magsasaka ang apektado</span>
                    </div>
                    <HoverTooltip text="Magpadala ng SMS broadcast sa mga apektadong magsasaka tungkol sa alertong ito.">
                      <Button className="w-full" onClick={() => setConfirmingAlert(alert)}>
                        Magpadala ng Abiso
                      </Button>
                    </HoverTooltip>
                  </CardContent>
                </Card>
              );
            })}
            {riskAlerts.length === 0 && (
              <p className="col-span-full py-4 text-center text-sm text-muted-foreground">Walang aktibong alerto sa ngayon.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <SmsFeedPreview />
          </div>
          <div className="lg:col-span-3">
            <ResourceStatus />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <DailySmsChart />
          <WeeklyInquiriesSummary />
        </div>
      </div>

      <AlertDialog open={!!confirmingAlert} onOpenChange={() => setConfirmingAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kumpirmahin ang Pagpapadala</AlertDialogTitle>
            <AlertDialogDescription>
              Sigurado ka bang nais mong magpadala ng abiso sa {confirmingAlert?.affected} na apektadong magsasaka tungkol sa alertong ito: "{confirmingAlert?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kanselahin</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendNotification}>Ituloy</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
