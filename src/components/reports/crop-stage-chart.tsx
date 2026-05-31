"use client"

import { Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, Cell } from "recharts"
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
import { useToast } from "@/hooks/use-toast";
import { openPrintableReport } from "@/lib/report-export";


const chartConfig = {
    Pagtatanim: { label: "Pagtatanim", color: "hsl(var(--chart-1))" },
    Paglago: { label: "Paglago", color: "hsl(var(--chart-2))" },
    Pamumulaklak: { label: "Pamumulaklak", color: "hsl(var(--chart-3))" },
    "Pag-aani": { label: "Pag-aani", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

export function CropStageChart() {
  const { cropStageData } = useAnalytics();
  const { activeLabel } = useReportsTimeframe();
  const { toast } = useToast();
  const hasCropStageData = cropStageData.some((item) => item.value > 0);

  const plantingStage = cropStageData.find(d => d.name === 'Pagtatanim')?.value ?? 0;
  const growingStage = cropStageData.find(d => d.name === 'Paglago')?.value ?? 0;
  
  const handleDownload = () => {
    const result = openPrintableReport({
      title: "Pamamahagi ng Yugto ng Pananim",
      timeframe: activeLabel,
      description: "Bilang ng active farmers ayon sa pinakabagong crop-stage signal na naitala sa system.",
      rows: cropStageData.map((entry) => ({
        Yugto: entry.name,
        Bilang: entry.value,
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
        <PieChart>
            <RechartsTooltip content={<ChartTooltipContent nameKey="name" />} />
            <Legend content={<ChartLegendContent nameKey="name"/>} />
            <Pie data={cropStageData} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%">
                 {cropStageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
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
                <CardTitle>Pamamahagi ng Yugto ng Pananim</CardTitle>
                <CardDescription>Porsyento ng mga pananim sa bawat yugto.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             {hasCropStageData ? (
              <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                      <p className="text-4xl font-bold text-chart-1">{plantingStage}</p>
                      <p className="text-xs text-muted-foreground">Nasa Pagtatanim</p>
                  </div>
                  <div className="flex flex-col items-center">
                      <p className="text-4xl font-bold text-chart-2">{growingStage}</p>
                      <p className="text-xs text-muted-foreground">Nasa Paglago</p>
                  </div>
              </div>
             ) : (
              <div className="px-6 text-center text-sm text-muted-foreground">
                Wala pang sapat na crop-stage signals sa napiling timeframe, kaya walang maipapakitang distribution sa ngayon.
              </div>
             )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {hasCropStageData
              ? 'Pagsusuri: Batay ito sa aktuwal na crop-stage records na naitala sa system.'
              : 'Kailangang magkaroon ng mas maraming crop-stage updates bago lumabas ang insight na ito sa napiling timeframe.'}
          </p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Pamamahagi ng Yugto ng Pananim ({activeLabel})</DialogTitle>
            <DialogDescription>
              Nagbibigay ang ulat na ito ng pangkalahatang-ideya ng kasalukuyang estado ng agrikultura sa barangay. Ang pag-alam kung anong yugto ang karamihan sa mga magsasaka ay nakakatulong sa pag-prioritize ng mga mapagkukunan at payo.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            {hasCropStageData ? (
              <>
                <div className="h-[400px] w-full mt-4">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                        {renderChart()}
                    </ChartContainer>
                </div>
                <div className="mt-8 text-sm text-muted-foreground space-y-2">
                    <p><strong>Detalyadong Pagsusuri:</strong> Sa napiling timeframe, {plantingStage} na crop records ang nasa yugto ng pagtatanim at {growingStage} ang nasa paglago.</p>
                    <p><strong>Rekomendasyon:</strong> Gamitin ang chart na ito para planuhin ang inputs at advisories kapag nagsimula nang maging consistent ang crop-stage encoding sa live workflow.</p>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                Hindi pa sapat ang naitalang crop-stage updates para makabuo ng expanded crop-stage report sa napiling timeframe.
              </div>
            )}
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

