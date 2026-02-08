'use client';
import { useState } from 'react';
import { Users, ShieldAlert, Sprout, CheckCircle2, Wind, Sun, Droplets, UserPlus, Archive, ClipboardList, Wheat } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { SmsFeedPreview } from "@/components/dashboard/sms-feed-preview";
import { ResourceStatus } from "@/components/dashboard/resource-status";
import { DailySmsChart } from "@/components/dashboard/daily-sms-chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { farmers as allFarmers, smsMessages, cropStageData, resources as allResources, alerts } from "@/lib/data";
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
import { TopInquiriesChart } from '@/components/reports/top-inquiries-chart';

export default function DashboardPage() {
    const approvedFarmersCount = allFarmers.filter(f => f.status === 'active' || f.status === 'inactive').length;
    const activeFarmsCount = allFarmers.filter(f => f.status === 'active').length;
    const activeIssuesCount = smsMessages.filter(m => m.status === 'pending_approval' && m.urgency === 'high').length;
    
    const pendingFarmersCount = allFarmers.filter(f => f.status === 'pending_approval').length;
    const highUrgencySmsCount = smsMessages.filter(m => m.urgency === 'high' && m.status === 'pending_approval').length;
    const criticalAlertsCount = alerts.filter(a => a.severity === 'Kritikal').length;
    const lowStockCount = allResources.filter(r => r.stock < 10).length;

    const [confirmingAlert, setConfirmingAlert] = useState<(typeof alerts)[0] | null>(null);
    const { toast } = useToast();

    const handleSendNotification = () => {
        if (!confirmingAlert) return;
        toast({
            title: "Abiso Ipinadala!",
            description: `Matagumpay na naipadala ang alerto sa ${confirmingAlert.affected} na magsasaka.`,
        });
        setConfirmingAlert(null);
    };

  return (
    <>
    <div className="flex flex-col gap-6">
       <div className="space-y-1">
        <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard ng Barangay</h1>
            <HelpDialog title="Dashboard ng Barangay">
                <p>Ito ang iyong pangunahing command center. Dito mo makikita ang isang mabilis na pangkalahatang-ideya ng lahat ng nangyayari sa iyong barangay, na nagbibigay-daan sa iyo na mabilis na matukoy ang mga prayoridad.</p>
                <p><strong>Mga Stat Card:</strong> Ang mga card sa itaas ay nagbibigay ng mahahalagang numero tulad ng kabuuang bilang ng mga magsasaka, mga nakabinbing pag-apruba, at mga bagong alerto. Ang pag-click sa mga ito ay magdadala sa iyo sa mga kaugnay na pahina para sa mas detalyadong impormasyon.</p>
                <p><strong>Sentro ng Panganib:</strong> Ang seksyon na ito ay awtomatikong sinusuri ang mga papasok na data (mula sa SMS at panahon) upang matukoy ang mga potensyal na panganib. Maaari kang magpadala ng abiso sa mga apektadong magsasaka nang direkta mula dito.</p>
                <p><strong>Live na Feed ng SMS & Katayuan ng Rekurso:</strong> Ito ay mga shortcut para sa iyong mga pang-araw-araw na gawain. Mabilis mong makikita ang mga pinakabagong mensahe at ang kasalukuyang estado ng iyong imbentaryo.</p>
            </HelpDialog>
        </div>
        <p className="text-muted-foreground">Buod ng mga aktibidad at alerto sa agrikultura sa iyong nasasakupan.</p>
      </div>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
              iconBgClass="bg-green-500/10"
              iconColorClass="text-green-500"
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
            <CardHeader>
                <CardTitle className="flex items-center gap-2">Mga Prayoridad na Gawain</CardTitle>
                <CardDescription>Mga mahahalagang item na nangangailangan ng iyong agarang atensyon.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <HoverTooltip text="Pumunta sa pahina ng pag-apruba para suriin ang mga bagong magsasaka.">
                    <Link href="/dashboard/farmers/approvals" className="block">
                        <div className="p-4 border rounded-lg flex items-center gap-4 hover:bg-accent hover:text-accent-foreground transition-colors h-full">
                            <UserPlus className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                            <div>
                                <p className="text-2xl font-bold">{pendingFarmersCount}</p>
                                <p className="text-sm text-muted-foreground">Nakabinbing Pag-apruba</p>
                            </div>
                        </div>
                    </Link>
                </HoverTooltip>
                 <HoverTooltip text="Pumunta sa SMS feed upang tugunan ang mga urgent na mensahe.">
                    <Link href="/dashboard/sms-feed" className="block">
                        <div className="p-4 border rounded-lg flex items-center gap-4 hover:bg-accent hover:text-accent-foreground transition-colors h-full">
                            <ClipboardList className="h-8 w-8 text-orange-500 flex-shrink-0" />
                            <div>
                                <p className="text-2xl font-bold">{highUrgencySmsCount}</p>
                                <p className="text-sm text-muted-foreground">Urgent na SMS</p>
                            </div>
                        </div>
                    </Link>
                </HoverTooltip>
                 <HoverTooltip text="Suriin ang mga kritikal na alerto sa panganib sa dashboard.">
                    <Link href="#risk-center" className="block" onClick={(e) => { e.preventDefault(); document.getElementById('risk-center')?.scrollIntoView({ behavior: 'smooth' }); }}>
                        <div className="p-4 border rounded-lg flex items-center gap-4 hover:bg-accent hover:text-accent-foreground transition-colors h-full">
                            <ShieldAlert className="h-8 w-8 text-red-500 flex-shrink-0" />
                            <div>
                                <p className="text-2xl font-bold">{criticalAlertsCount}</p>
                                <p className="text-sm text-muted-foreground">Kritikal na Alerto</p>
                            </div>
                        </div>
                    </Link>
                </HoverTooltip>
                <HoverTooltip text="Pumunta sa imbentaryo upang pamahalaan ang mga suplay.">
                    <Link href="/dashboard/inventory" className="block">
                        <div className="p-4 border rounded-lg flex items-center gap-4 hover:bg-accent hover:text-accent-foreground transition-colors h-full">
                            <Archive className="h-8 w-8 text-blue-500 flex-shrink-0" />
                            <div>
                                <p className="text-2xl font-bold">{lowStockCount}</p>
                                <p className="text-sm text-muted-foreground">Mababang Stock</p>
                            </div>
                        </div>
                    </Link>
                </HoverTooltip>
            </CardContent>
        </Card>

       <Card className="border-destructive/50" id="risk-center">
        <CardHeader className="flex-row items-start justify-between">
            <div className="flex-1">
                <div className="flex items-center">
                    <CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert /> Sentro ng Panganib at Alerto ng Barangay</CardTitle>
                    <HelpDialog title="Sentro ng Panganib at Alerto">
                        <p>Ang seksyon na ito ay ang iyong "early warning system." Awtomatiko nitong sinusuri ang mga papasok na data (mula sa SMS ng magsasaka at mga ulat ng panahon) upang matukoy ang mga potensyal na panganib sa agrikultura.</p>
                        <p>Bawat card ay kumakatawan sa isang aktibong alerto. Ipinapakita nito ang uri ng panganib, isang maikling paglalarawan, at kung gaano karaming magsasaka ang maaaring maapektuhan. Ang layunin ay bigyan ka ng mabilis na kamalayan sa mga umuusbong na problema.</p>
                        <p><strong>Magpadala ng Abiso:</strong> Pindutin ang button na ito upang mag-broadcast ng isang babala sa lahat ng mga magsasaka na nasa panganib. Ito ay isang mabilis na paraan upang magbigay ng maagang babala at mga tagubilin sa pag-iwas.</p>
                    </HelpDialog>
                </div>
                <CardDescription>Mga awtomatikong nabuong alerto batay sa data ng panahon at mga ulat sa bukid.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            {alerts.map(alert => {
                const Icon = alert.icon;
                return (
                    <Card key={alert.id} className="flex flex-col">
                        <CardHeader className="flex-row items-start gap-4 space-y-0">
                            <div className="p-2 bg-destructive/10 rounded-md">
                                <Icon className="w-5 h-5 text-destructive"/>
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-base">{alert.title}</CardTitle>
                                <CardDescription>{alert.description}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-end gap-4">
                            <div className="flex justify-between items-center text-sm">
                                <Badge variant={alert.severity === 'Kritikal' ? 'destructive' : 'secondary'}>{alert.severity}</Badge>
                                <span className="text-muted-foreground">{alert.affected} magsasaka ang apektado</span>
                            </div>
                             <HoverTooltip text="Magpadala ng SMS broadcast sa mga apektadong magsasaka tungkol sa alertong ito.">
                                <Button className="w-full" onClick={() => setConfirmingAlert(alert)}>Magpadala ng Abiso</Button>
                            </HoverTooltip>
                        </CardContent>
                    </Card>
                )
            })}
        </CardContent>
      </Card>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <SmsFeedPreview />
        </div>
        <div className="lg:col-span-3">
            <ResourceStatus />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <DailySmsChart />
        <TopInquiriesChart />
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
