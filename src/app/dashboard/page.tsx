
import { Users, ShieldAlert, Sprout, Wheat, CheckCircle2, Wind, Sun, Droplets, UserPlus } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { SmsFeedPreview } from "@/components/dashboard/sms-feed-preview";
import { ResourceStatus } from "@/components/dashboard/resource-status";
import { DailySmsChart } from "@/components/dashboard/daily-sms-chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { farmers as allFarmers, smsMessages, cropStageData } from "@/lib/data";

const alerts = [
    {
        id: 'ALERT001',
        icon: Droplets,
        title: 'Panganib ng Baha (72 Oras)',
        description: 'Posible ang malakas na pag-ulan sa susunod na 3 araw. Aabisuhan ang 24 na magsasaka sa mga lugar na mababa.',
        severity: 'Kritikal',
        affected: 24,
    },
    {
        id: 'ALERT002',
        icon: ShieldAlert,
        title: 'Pagdami ng Peste',
        description: 'May 5 ulat ng rice leaf blight sa Purok 3. Inirerekomenda ang agarang pag-inspeksyon.',
        severity: 'Babala',
        affected: 5,
    },
    {
        id: 'ALERT003',
        icon: Wind,
        title: 'Babala ng Malakas na Hangin',
        description: 'Inaasahan ang malakas na hangin bukas. I-secure ang mga pananim at istruktura ng bukid.',
        severity: 'Babala',
        affected: 347,
    },
    {
        id: 'ALERT004',
        icon: Sun,
        title: 'Babala ng Matinding Init',
        description: 'Inaasahan ang matinding init sa susunod na 48 oras. Tiyaking sapat ang patubig.',
        severity: 'Babala',
        affected: 150,
    }
]

export default function DashboardPage() {
    const approvedFarmersCount = allFarmers.filter(f => f.status === 'active' || f.status === 'inactive').length;
    const pendingFarmersCount = allFarmers.filter(f => f.status === 'pending_approval').length;
    const pestAlertsCount = smsMessages.filter(m => m.parsedIntent === 'PEST_DISEASE' && m.status === 'pending_approval').length;
    
    const plantingCount = cropStageData.find(d => d.name === 'Pagtatanim')?.value ?? 0;
    const growingCount = cropStageData.find(d => d.name === 'Paglago')?.value ?? 0;
    const harvestingCount = cropStageData.find(d => d.name === 'Pag-aani')?.value ?? 0;

  return (
    <div className="flex flex-col gap-6">
       <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard ng Barangay</h1>
        <p className="text-muted-foreground">Buod ng mga aktibidad at alerto sa agrikultura sa iyong nasasakupan.</p>
      </div>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Link href="/dashboard/farmers">
            <StatCard
            title="Kabuuang Magsasaka"
            value={String(approvedFarmersCount)}
            icon={Users}
            description="Lahat ng aprubadong magsasaka"
            iconBgClass="bg-primary/10"
            />
        </Link>
        <Link href="/dashboard/farmers/approvals">
            <StatCard
            title="Nakabinbing Pag-apruba"
            value={String(pendingFarmersCount)}
            icon={UserPlus}
            description="Bagong rehistro para suriin"
            iconBgClass="bg-yellow-500/10"
            />
        </Link>
        <Link href="/dashboard/sms-feed">
            <StatCard
            title="Mga Alertong Pang-peste"
            value={String(pestAlertsCount)}
            icon={ShieldAlert}
            description="Mga aktibong ulat ng peste"
            iconBgClass="bg-destructive/10"
            />
        </Link>
        <StatCard
          title="Nasa Pagtatanim"
          value={String(plantingCount)}
          icon={Sprout}
          description="Bilang ng mga sakahan sa yugto ng pagtatanim"
          iconBgClass="bg-blue-500/10"
        />
        <StatCard
          title="Nasa Paglago"
          value={String(growingCount)}
          icon={Wheat}
          description="Bilang ng mga sakahan sa yugto ng paglago"
          iconBgClass="bg-amber-500/10"
        />
        <StatCard
          title="Handa nang Anihin"
          value={String(harvestingCount)}
          icon={CheckCircle2}
          description="Bilang ng mga sakahan na malapit nang mag-ani"
          iconBgClass="bg-green-500/10"
        />
      </div>

       <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert /> Sentro ng Panganib at Alerto ng Barangay</CardTitle>
          <CardDescription>Mga awtomatikong nabuong alerto batay sa data ng panahon at mga ulat sa bukid.</CardDescription>
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
                            <Button className="w-full">Magpadala ng Abiso</Button>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        <DailySmsChart />
      </div>

    </div>
  );
}
