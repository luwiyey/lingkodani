"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { useReportsTimeframe } from "@/context/reports-timeframe-context"
import { ChartConfig, ChartContainer, ChartLegendContent, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Expand, Download } from "lucide-react";
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
import { openPrintableReport } from "@/lib/report-export";


const chartConfig = {
  total: {
    label: "Dami ng SMS",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig


export function SmsVolumeChart() {
  const { smsVolumeData } = useAnalytics();
  const { timeframe, setTimeframe } = useReportsTimeframe();
  const { toast } = useToast();

  const totalSms = smsVolumeData.reduce((acc, item) => acc + item.total, 0);
  const peakDay = smsVolumeData.reduce((prev, current) => (prev.total > current.total) ? prev : current);
  const timeframeLabel = timeframe === 'Ngayong Araw'
    ? 'sa bawat 4 na oras'
    : timeframe === 'Lingguhan'
      ? 'sa bawat araw'
      : timeframe === 'Buwanan'
        ? 'sa bawat linggo'
        : 'sa bawat buwan';

  const handleDownload = () => {
    const result = openPrintableReport({
      title: "Chart ng Dami ng SMS",
      timeframe,
      description: "Kabuuang dami ng inbound SMS sa napiling reporting window.",
      rows: smsVolumeData.map((entry) => ({
        Panahon: entry.name,
        "Dami ng SMS": entry.total,
      })),
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
        <BarChart data={smsVolumeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8}/>
          <YAxis tickLine={false} axisLine={false} tickMargin={8}/>
          <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Legend content={<ChartLegendContent />} />
          <Bar dataKey="total" fill="var(--color-total)" radius={4} />
        </BarChart>
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
                <CardTitle>Chart ng Dami ng SMS</CardTitle>
                <CardDescription>Kabuuang papasok na SMS {timeframeLabel}.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-1">{totalSms}</p>
                <p className="text-sm text-muted-foreground">Kabuuang SMS ({timeframe})</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Pinakamataas ang dami ng SMS sa {peakDay.name} ({peakDay.total} mensahe).</p>
        </CardFooter>
      </Card>
       <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Chart ng Dami ng SMS ({timeframe})</DialogTitle>
            <DialogDescription>
              Ipinapakita ng ulat na ito ang dami ng mga papasok na mensahe ng SMS sa isang tinukoy na panahon. Nakakatulong ito sa mga admin na maunawaan ang mga pattern ng komunikasyon at mga panahon ng mataas na aktibidad.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Sa napiling timeframe, ang pinakamataas na bilang ng mga mensahe ay naitala sa {peakDay.name}. Ang kabuuang {totalSms} na inbound SMS ay nagbibigay ng mabilis na larawan kung kailan pinakaaktibo ang pag-uulat ng mga magsasaka sa kasalukuyang reporting window.</p>
                <p><strong>Rekomendasyon:</strong> I-match ang staffing at follow-up readiness sa mga period na may pinakamataas na volume. Kapag tuloy-tuloy na mataas ang SMS count sa parehong period, maaaring maghanda ng mas maagang advisories o reminder broadcasts para hindi magsabay-sabay ang urgent cases.</p>
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




