"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts"
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
  ulat: {
    label: "Ulat",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

export function OutbreakAlertChart() {
  const { outbreakAlertData } = useAnalytics();
  const { activeLabel } = useReportsTimeframe();
  const safeData = outbreakAlertData.length > 0 ? outbreakAlertData : [{ date: 'Wala pa', ulat: 0 }];
  const handleDownload = () => {
    void openPrintableReport({
      title: "Outbreak Alerts",
      timeframe: activeLabel,
      description: "Trend ng outbreak alert levels sa napiling timeframe.",
      rows: sanitizePrintableRows(safeData),
    });
  };

  const peak = safeData.reduce((prev, current) => (prev.ulat > current.ulat) ? prev : current);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={safeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <RechartsTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="ulat" stroke="var(--color-ulat)" strokeWidth={2} dot={true} />
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
                <CardTitle>Mga Alerto sa Peste</CardTitle>
                <CardDescription>Biglaang pagdami ng ulat ng parehong peste.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-destructive">{peak.ulat}</p>
                <p className="text-sm text-muted-foreground">ulat noong {peak.date}</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: {peak.ulat > 0 ? `Pinakamataas ang pest-related signal noong ${peak.date} na may ${peak.ulat} ulat.` : 'Wala pang naitalang pest spike sa timeframe na ito.'}</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Mga Alerto sa Peste ({activeLabel})</DialogTitle>
            <DialogDescription>
              Sinusubaybayan ng chart na ito ang mga biglaang pagtaas sa bilang ng mga ulat tungkol sa parehong uri ng peste o sakit sa isang maikling panahon, na maaaring magpahiwatig ng isang outbreak.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> {peak.ulat > 0 ? `Isang malinaw na spike ang makikita noong ${peak.date}, kung saan umabot sa ${peak.ulat} na ulat ang naitala. Ito ang pinakamalakas na pest-related signal sa napiling timeframe.` : 'Kapag may malinaw na spike na lumitaw dito, iyon ang magiging senyales para sa posibleng pest cluster o outbreak investigation.'}</p>
                <p><strong>Rekomendasyon:</strong> Kapag nakakita ng ganitong spike, agad na suriin ang mga kaugnay na ulat. Gamitin ang "Geographic Hotspot" chart upang makita kung ang outbreak ay puro sa isang partikular na lugar. Magpadala ng isang targeted na alerto sa mga magsasaka sa apektadong lugar na may mga tagubilin sa pag-iwas at pagkontrol.</p>
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


