"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { useReportsTimeframe } from "@/context/reports-timeframe-context"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
import { ReportScopePicker } from "@/components/reports/report-scope-picker";
import { Button } from "@/components/ui/button";
import { Expand, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { openPrintableReport, sanitizePrintableRows } from "@/lib/report-export";


const chartConfig = {
  count: {
    label: "Bilang ng Magsasaka",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function FarmerEngagementChart() {
  const { farmerEngagementData } = useAnalytics();
  const { activeLabel } = useReportsTimeframe();
  const { toast } = useToast();
  
  const totalFarmers = farmerEngagementData.reduce((acc, item) => acc + item.count, 0);
  const topSegment = farmerEngagementData.reduce((prev, current) => (prev.count > current.count ? prev : current), farmerEngagementData[0]);
  
    const handleDownload = () => {
    const result = openPrintableReport({
      title: "Pakikilahok ng Magsasaka",
      timeframe: activeLabel,
      description: "Bilang ng active at inactive farmer engagement records.",
      rows: sanitizePrintableRows(farmerEngagementData),
    });

    if (!result.ok) {
      toast({
        title: "Hindi nabuksan ang PDF export",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const renderChart = () => (
     <ResponsiveContainer width="100%" height="100%">
        <BarChart data={farmerEngagementData} accessibilityLayer>
          <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
          <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={4} />
        </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Dialog>
      <Card>
        <CardHeader>
          <div className="flex justify-end gap-2">
                <ReportScopePicker />
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <Expand className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownload}>
                          <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>I-save ang graph bilang PDF</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid gap-0.5">
                  <CardTitle>Antas ng Pakikilahok ng Magsasaka</CardTitle>
                  <CardDescription>Pamamahagi batay sa dalas ng pag-uulat.</CardDescription>
              </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-2">{totalFarmers}</p>
                <p className="text-sm text-muted-foreground">Aktibong Magsasaka</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: {totalFarmers > 0 ? `Pinakamalaki ang segment na "${topSegment.type}" sa napiling timeframe.` : 'Wala pang sapat na live engagement data sa timeframe na ito.'}</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Antas ng Pakikilahok ng Magsasaka ({activeLabel})</DialogTitle>
            <DialogDescription>
              Kinakategorya nito ang mga magsasaka batay sa kung gaano sila kadalas nakikipag-ugnayan sa sistema. Ang pag-unawa sa engagement ay tumutulong na sukatin ang pagiging kapaki-pakinabang at pag-ampon ng platform.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Sa live dataset, may {farmerEngagementData.find((item) => item.type === 'First-time')?.count ?? 0} first-time, {farmerEngagementData.find((item) => item.type === 'Repeat')?.count ?? 0} repeat, at {farmerEngagementData.find((item) => item.type === 'Frequent')?.count ?? 0} frequent reporters. Ipinapakita nito kung gaano karaming farmers ang bumabalik para muling makipag-ugnayan sa barangay team.</p>
                <p><strong>Rekomendasyon:</strong> Mag-isip ng mga paraan upang hikayatin ang mga "First-time" na gumagamit na maging "Repeat" reporters. Maaaring ito ay sa pamamagitan ng mga follow-up na mensahe na nagtatanong kung naging kapaki-pakinabang ang payo o pagpapadala ng mga pangkalahatang tip. Kilalanin o bigyan ng insentibo ang mga "Frequent" reporters para sa kanilang patuloy na kontribusyon sa data ng komunidad.</p>
            </div>
        </div>
        <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
                <Button type="button" variant="secondary">Isara</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


