"use client"

import { Pie, PieChart, Cell, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { useReportsTimeframe } from "@/context/reports-timeframe-context"
import { ChartConfig, ChartContainer, ChartLegendContent, ChartTooltipContent } from "../ui/chart"
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
import { openPrintableReport, sanitizePrintableRows } from "@/lib/report-export";


const chartConfig = {
  Napadala: { label: "Napadala", color: "hsl(var(--chart-1))" },
  Nabigo: { label: "Nabigo", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function SmsDeliveryStatusChart() {
  const { smsDeliveryStatusData } = useAnalytics();
  const { activeLabel } = useReportsTimeframe();
  const handleDownload = () => {
    void openPrintableReport({
      title: "SMS Delivery Status",
      timeframe: activeLabel,
      description: "Katayuan ng outbound SMS delivery sa napiling timeframe.",
      rows: sanitizePrintableRows(smsDeliveryStatusData),
    });
  };

  const successCount = smsDeliveryStatusData.find(d => d.name === 'Napadala')?.value ?? 0;
  const failureCount = smsDeliveryStatusData.find(d => d.name === 'Nabigo')?.value ?? 0;
  const total = successCount + failureCount;
  const successRate = total > 0 ? ((successCount / total) * 100).toFixed(1) : '0.0';

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <RechartsTooltip content={<ChartTooltipContent nameKey="name" />} />
        <Legend content={<ChartLegendContent nameKey="name" />} />
        <Pie data={smsDeliveryStatusData} dataKey="value" nameKey="name" innerRadius="60%">
          {smsDeliveryStatusData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
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
                <CardTitle>Katayuan ng Pagpapadala ng SMS</CardTitle>
                <CardDescription>Rate ng tagumpay sa pagpapadala ng mga mensahe.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-1">{successRate}%</p>
                <p className="text-sm text-muted-foreground">ang Matagumpay na Naipadala</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: {successRate}% ng outbound SMS records sa timeframe na ito ang matagumpay na naipadala o na-deliver.</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Katayuan ng Pagpapadala ng SMS ({activeLabel})</DialogTitle>
            <DialogDescription>
              Sinusubaybayan ng ulat na ito ang rate ng tagumpay ng mga papalabas na mensahe ng SMS mula sa sistema patungo sa mga magsasaka. Ito ay isang mahalagang sukatan ng teknikal na pagiging maaasahan.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Batay sa aktuwal na outbound records, {successRate}% ng mga mensahe ang matagumpay na naipadala o na-deliver habang {failureCount} ang nabigo sa napiling timeframe. Kapag mababa ang success rate, kailangan i-check ang provider status, recipient number quality, at device connectivity.</p>
                <p><strong>Rekomendasyon:</strong> Habang mataas ang rate ng tagumpay, mahalagang subaybayan pa rin ito. Kung may biglaang pagtaas sa rate ng pagkabigo, dapat itong imbestigahan kaagad dahil maaaring magpahiwatig ito ng isang problema sa SMS gateway provider o sa configuration ng sistema.</p>
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





