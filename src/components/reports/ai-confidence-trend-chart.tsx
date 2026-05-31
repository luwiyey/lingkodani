"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { useReportsTimeframe } from "@/context/reports-timeframe-context"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
import { ReportScopePicker } from "@/components/reports/report-scope-picker";
import { Button } from "@/components/ui/button";
import { Expand, TrendingUp, Download } from "lucide-react";
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
  confidence: {
    label: "Kumpiyansa (%)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function AIConfidenceTrendChart() {
  const { aiConfidenceTrendData } = useAnalytics();
  const { activeLabel } = useReportsTimeframe();
  const { toast } = useToast();
  
  const latestConfidence = aiConfidenceTrendData[aiConfidenceTrendData.length - 1].confidence;
  const firstConfidence = aiConfidenceTrendData[0]?.confidence ?? latestConfidence;
  const confidenceDelta = latestConfidence - firstConfidence;
  
    const handleDownload = () => {
    const result = openPrintableReport({
      title: "Trend ng AI Confidence",
      timeframe: activeLabel,
      description: "Average AI confidence scores sa bawat reporting period.",
      rows: sanitizePrintableRows(aiConfidenceTrendData),
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
        <LineChart data={aiConfidenceTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis unit="%" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <RechartsTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="confidence" stroke="var(--color-confidence)" strokeWidth={2} dot={true} />
        </LineChart>
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
                <CardTitle>Trend ng Kumpiyansa ng AI</CardTitle>
                <CardDescription>Pag-unlad ng kumpiyansa ng AI sa paglipas ng panahon.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex items-center gap-2 text-chart-1">
                <TrendingUp className="h-16 w-16" />
                <div>
                    <p className="text-5xl font-bold">{latestConfidence}%</p>
                    <p className="text-sm text-muted-foreground">Kasalukuyang Kumpiyansa</p>
                </div>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: {confidenceDelta > 0 ? 'Tumaas' : confidenceDelta < 0 ? 'Bumaba' : 'Nanatiling halos pareho'} ang AI confidence sa napiling timeframe.</p>
        </CardFooter>
      </Card>
       <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Trend ng Kumpiyansa ng AI ({activeLabel})</DialogTitle>
            <DialogDescription>
                Sinusubaybayan ng chart na ito ang average na confidence score ng AI sa pag-interpret ng mga SMS sa paglipas ng panahon. Ang isang pataas na trend ay nagpapahiwatig na ang AI ay natututo at gumagaling mula sa mga feedback at pagwawasto.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Batay sa live dataset, ang average confidence ng AI ay gumalaw mula {firstConfidence}% papuntang {latestConfidence}% sa napiling timeframe. Kapag tumataas ito, posibleng mas maraming mensahe ang tumutugma sa mga pattern na kaya nang basahin ng model; kapag bumababa, maaaring may bagong klase ng concern o wording na kailangang i-review.</p>
                <p><strong>Rekomendasyon:</strong> Ipagpatuloy ang regular na pagbibigay ng feedback at pagwawasto sa mga mungkahi ng AI. Bigyang-pansin ang mga mensahe kung saan biglang bumababa ang kumpiyansa; maaaring ito ay nagpapahiwatig ng isang bagong uri ng tanong o isang kumplikadong isyu na kailangang pag-aralan.</p>
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


