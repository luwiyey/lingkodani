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
  count: {
    label: "Bilang",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function RecommendationTypeChart() {
  const { recommendationTypeData } = useAnalytics();
  const { activeLabel } = useReportsTimeframe();
  const handleDownload = () => {
    void openPrintableReport({
      title: "Uri ng Rekomendasyon",
      timeframe: activeLabel,
      description: "Mga uri ng rekomendasyong ibinigay ng system sa mga kaso.",
      rows: sanitizePrintableRows(recommendationTypeData),
    });
  };
  
  const mostCommonType = recommendationTypeData.reduce((prev, current) => (prev.count > current.count) ? prev : current);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={recommendationTypeData} accessibilityLayer>
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
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
                <CardTitle>Uri ng Mga Inirekomendang Payo</CardTitle>
                <CardDescription>Ano ang mga pinakamadalas na uri ng payo ng AI.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-3">{mostCommonType.count}</p>
                <p className="text-sm text-muted-foreground">Payo sa {mostCommonType.name}</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: {mostCommonType.count > 0 ? `"${mostCommonType.name}" ang pinakamadalas na uri ng payo sa timeframe na ito.` : 'Wala pang sapat na AI advice records para sa timeframe na ito.'}</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Uri ng Mga Inirekomendang Payo ({activeLabel})</DialogTitle>
            <DialogDescription>
              Kinakategorya ng ulat na ito ang mga payo na ibinibigay ng sistema. Ang pag-unawa kung anong uri ng tulong ang pinakamadalas na ibinibigay ay nakakatulong na matukoy ang mga pangunahing tungkulin ng sistema.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Batay sa live advice records, ang pinakakaraniwang recommendation type sa timeframe na ito ay "{mostCommonType.name}". Ipinapakita nito kung anong klaseng intervention style ang kasalukuyang pinaka-madalas lumalabas sa system output.</p>
                <p><strong>Rekomendasyon:</strong> Palakasin ang mga payo sa "Pag-iwas" sa pamamagitan ng pag-broadcast ng mga seasonal na tip. Para sa mga "Referral", pag-aralan ang mga kasong ito upang makita kung may mga umuulit na tema na maaaring matutunan ng AI, upang mabawasan ang bilang ng mga referral sa hinaharap.</p>
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


