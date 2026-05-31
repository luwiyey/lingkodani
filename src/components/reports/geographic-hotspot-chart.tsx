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
  issues: {
    label: "Mga Isyu",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function GeographicHotspotChart() {
  const { geographicHotspotData } = useAnalytics();
  const { activeLabel } = useReportsTimeframe();
  const { toast } = useToast();
  const hasHotspotData = geographicHotspotData.some((item) => item.issues > 0);

  const topHotspot = hasHotspotData
    ? geographicHotspotData.reduce((prev, current) => (prev.issues > current.issues) ? prev : current)
    : null;
  
    const handleDownload = () => {
    const result = openPrintableReport({
      title: "Geographic Hotspots",
      timeframe: activeLabel,
      description: "Mga zone na may pinakamaraming naitalang concerns.",
      rows: sanitizePrintableRows(geographicHotspotData),
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
      <BarChart data={geographicHotspotData} accessibilityLayer>
        <XAxis dataKey="zone" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="issues" fill="var(--color-issues)" radius={4} />
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
                <CardTitle>Mga Hotspot ng Suliranin</CardTitle>
                <CardDescription>Distribusyon ng mga isyu sa bawat lokasyon.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             {topHotspot ? (
              <div className="flex flex-col items-center gap-2">
                  <p className="text-5xl font-bold text-chart-4">{topHotspot.issues}</p>
                  <p className="text-sm text-muted-foreground">isyu sa {topHotspot.zone}</p>
              </div>
             ) : (
              <div className="px-6 text-center text-sm text-muted-foreground">
                Wala pang sapat na live location data para tukuyin ang hotspot ng mga isyu.
              </div>
             )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {topHotspot
              ? `Pagsusuri: Sa kasalukuyang live reports, ang ${topHotspot.zone} ang may pinakamaraming isyu.`
              : 'Magpapakita lang ang hotspot insight kapag may sapat nang location-linked reports sa live dataset.'}
          </p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Mga Hotspot ng Suliranin ({activeLabel})</DialogTitle>
            <DialogDescription>
              Ipinapakita ng mapang ito kung saan sa barangay nagkukumpol ang mga isyu. Ang pagtukoy sa mga "hotspot" na ito ay nagbibigay-daan para sa naka-target na interbensyon at mahusay na paglalaan ng mga mapagkukunan.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            {hasHotspotData && topHotspot ? (
              <>
                <div className="h-[400px] w-full mt-4">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                        {renderChart()}
                    </ChartContainer>
                </div>
                <div className="mt-8 text-sm text-muted-foreground space-y-2">
                    <p><strong>Detalyadong Pagsusuri:</strong> Ang ulat na ito ay batay lamang sa live reports na may naka-link na farmer location o sitio. Sa napiling timeframe, ang {topHotspot.zone} ang may pinakamataas na bilang ng isyu.</p>
                    <p><strong>Rekomendasyon:</strong> I-compare ang hotspot na ito sa field visits at assistance queue para makita kung kailangan ng naka-target na follow-through.</p>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                Wala pang sapat na location-linked live reports para sa hotspot analysis.
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





