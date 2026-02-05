
import { Users, ShieldAlert, Inbox, Sprout, Wheat, CheckCircle2, Wind, Sun, Droplets } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SmsFeedPreview } from "@/components/dashboard/sms-feed-preview";
import { ResourceStatus } from "@/components/dashboard/resource-status";
import { DailySmsChart } from "@/components/dashboard/daily-sms-chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

       <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert /> Sentro ng Panganib at Alerto ng Barangay</CardTitle>
          <CardDescription>Mga awtomatikong nabuong alerto batay sa data ng panahon at mga ulat sa bukid.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                        <CardContent className="flex-grow flex flex-col justify-end">
                            <div className="flex justify-between items-center text-sm">
                                <Badge variant={alert.severity === 'Kritikal' ? 'destructive' : 'secondary'}>{alert.severity}</Badge>
                                <span className="text-muted-foreground">{alert.affected} magsasaka ang apektado</span>
                            </div>
                            <Button className="w-full mt-4">Magpadala ng Abiso</Button>
                        </CardContent>
                    </Card>
                )
            })}
        </CardContent>
      </Card>

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

    