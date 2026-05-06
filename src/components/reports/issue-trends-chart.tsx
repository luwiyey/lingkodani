"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { useReportsTimeframe } from "@/context/reports-timeframe-context"
import { ChartConfig, ChartContainer, ChartLegendContent, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Expand, TrendingUp, Download } from "lucide-react";
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
  MgaPeste: {
    label: "Mga Peste",
    color: "hsl(var(--chart-1))",
  },
  Sakit: {
    label: "Sakit",
    color: "hsl(var(--chart-2))",
  },
  Patubig: {
    label: "Patubig",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function IssueTrendsChart() {
  const { issueTrendsData } = useAnalytics();
  const { timeframe, setTimeframe } = useReportsTimeframe();
  const { toast } = useToast();

  const latestPestData = issueTrendsData[issueTrendsData.length - 1].MgaPeste;
  const latestPoint = issueTrendsData[issueTrendsData.length - 1];
  const leadingIssue = latestPoint
    ? [
        { label: 'Mga Peste', value: latestPoint.MgaPeste },
        { label: 'Sakit', value: latestPoint.Sakit },
        { label: 'Patubig', value: latestPoint.Patubig },
      ].reduce((prev, current) => (prev.value > current.value ? prev : current))
    : { label: 'Walang sapat na data', value: 0 };
  
    const handleDownload = () => {
    const result = openPrintableReport({
      title: "Trend ng Uri ng Concern",
      timeframe,
      description: "Pagbabago ng pangunahing uri ng concern sa napiling timeframe.",
      rows: sanitizePrintableRows(issueTrendsData),
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
        <LineChart data={issueTrendsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
            <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
            <RechartsTooltip content={<ChartTooltipContent />} />
            <Legend content={<ChartLegendContent />} />
            <Line type="monotone" dataKey="MgaPeste" stroke="var(--color-MgaPeste)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Sakit" stroke="var(--color-Sakit)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Patubig" stroke="var(--color-Patubig)" strokeWidth={2} dot={false} />
        </LineChart>
    </ResponsiveContainer>
  );

  return (
    <Dialog>
      <Card>
        <CardHeader>
          <div className="flex justify-end gap-2">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{timeframe}</span>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setTimeframe('Ngayong Araw')}>Ngayong Araw</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeframe('Lingguhan')}>Lingguhan</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeframe('Buwanan')}>Buwanan</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeframe('Quarterly')}>Quarterly</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeframe('Taunan')}>Taunan</DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
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
                <CardTitle>Graph ng Trend ng Isyu</CardTitle>
                <CardDescription>Lingguhang uso ng mga pangunahing isyu.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex items-center gap-2 text-chart-1">
                <TrendingUp className="h-12 w-12" />
                <div>
                    <p className="text-4xl font-bold">{latestPestData}</p>
                    <p className="text-sm text-muted-foreground">Ulat ng Peste (Kasalukuyan)</p>
                </div>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: {leadingIssue.value > 0 ? `Sa pinakahuling point ng timeframe, nangunguna ang "${leadingIssue.label}" na may ${leadingIssue.value} ulat.` : 'Wala pang sapat na trend signal sa live dataset para sa timeframe na ito.'}</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Graph ng Trend ng Isyu ({timeframe})</DialogTitle>
            <DialogDescription>
                Ipinapakita ng chart na ito ang pagbabago sa dami ng mga ulat para sa mga pangunahing kategorya ng isyu sa paglipas ng panahon. Nakakatulong ito na matukoy ang mga umuusbong na problema at mga seasonal na pattern.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ipinapakita ng chart ang aktuwal na paggalaw ng mga pangunahing issue categories sa napiling timeframe. Sa kasalukuyang snapshot, nangunguna ang "{leadingIssue.label}" na may {leadingIssue.value} ulat, kaya iyon ang mas dapat pagtuunan ng pansin sa operational planning.</p>
                <p><strong>Rekomendasyon:</strong> Maglabas ng isang advisory broadcast tungkol sa pagmamanman ng peste. I-cross-reference ang data na ito sa "Geographic Hotspot" chart upang matukoy kung ang pagtaas ng ulat ng peste ay puro sa isang partikular na zone. Maghanda ng mga mapagkukunan (hal., mga artikulo sa knowledge base, mga contact ng AEW) na may kaugnayan sa pagkontrol ng peste.</p>
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


