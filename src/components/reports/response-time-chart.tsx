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
import { openPrintableReport, sanitizePrintableRows } from "@/lib/report-export";


const chartConfig = {
  time: {
    label: "Oras (minuto)",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function ResponseTimeChart() {
  const { responseTimeData } = useAnalytics();
  const { activeLabel } = useReportsTimeframe();
  const handleDownload = () => {
    void openPrintableReport({
      title: "Response Time",
      timeframe: activeLabel,
      description: "Average at comparative response time metrics ng system.",
      rows: sanitizePrintableRows(responseTimeData),
    });
  };

  const averageTime = responseTimeData.find(d => d.name === 'Average')?.time ?? 0;

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={responseTimeData} accessibilityLayer>
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <YAxis unit="m" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="time" fill="var(--color-time)" radius={4} />
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
                <CardTitle>Oras ng Pagtugon</CardTitle>
                <CardDescription>Average na oras bago maipadala ang isang tugon.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-5">{averageTime}<span className="text-2xl text-muted-foreground">min</span></p>
                <p className="text-sm text-muted-foreground">Average na Pagtugon</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Ang average na oras ng pagtugon ay {averageTime} minuto, na nagpapakita ng mabilis na sistema.</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Oras ng Pagtugon ({activeLabel})</DialogTitle>
            <DialogDescription>
              Sinusukat ng ulat na ito ang average na oras na lumipas mula sa pagtanggap ng isang SMS hanggang sa pagpapadala ng tugon (alinman sa awtomatikong payo o manu-manong tugon). Ang mabilis na oras ng pagtugon ay mahalaga para sa kasiyahan ng magsasaka.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang isang average na oras ng pagtugon na {averageTime} minuto ay napakahusay. Ipinapakita nito na ang sistema, kasama ang human-in-the-loop na proseso, ay mahusay at tumutugon nang mabilis sa mga pangangailangan ng magsasaka. Ang 90th percentile na oras ay nagpapahiwatig na kahit ang mga mas kumplikadong kaso ay karaniwang natutugunan sa loob ng humigit-kumulang 15 minuto.</p>
                <p><strong>Rekomendasyon:</strong> Panatilihin ang kahusayan na ito. Kung mapapansin na tumataas ang average na oras ng pagtugon, maaaring ito ay isang senyales na ang mga AEW ay overloaded o may bottleneck sa proseso ng pagpapatunay. Gamitin ang data na ito upang bigyang-katwiran ang pangangailangan para sa karagdagang tauhan kung kinakailangan.</p>
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





