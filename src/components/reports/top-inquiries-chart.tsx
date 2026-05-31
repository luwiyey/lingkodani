"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function TopInquiriesChart() {
  const { topInquiriesData } = useAnalytics();
  const { activeLabel } = useReportsTimeframe();
  const handleDownload = () => {
    void openPrintableReport({
      title: "Top Inquiries",
      timeframe: activeLabel,
      description: "Pinakamadalas na uri ng inquiry mula sa mga magsasaka.",
      rows: sanitizePrintableRows(topInquiriesData),
    });
  };
  const hasInquiryData = topInquiriesData.some((item) => item.count > 0);
  const topInquiry = hasInquiryData
    ? topInquiriesData.reduce((prev, current) => (prev.count > current.count) ? prev : current)
    : null;

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={topInquiriesData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="question" 
              type="category" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              width={120}
            />
            <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
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
                <CardTitle>Pinakakaraniwang Uri ng Inquiry</CardTitle>
                <CardDescription>Mga aktuwal na concern categories mula sa live SMS dataset.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             {topInquiry ? (
              <div className="flex flex-col items-center gap-2">
                  <p className="text-5xl font-bold text-chart-5">{topInquiry.count}</p>
                  <p className="text-sm text-muted-foreground text-center">mensahe sa category na "{topInquiry.question}"</p>
              </div>
             ) : (
              <div className="px-6 text-center text-sm text-muted-foreground">
                Wala pang sapat na live inquiry data para tukuyin ang pinakakaraniwang tanong.
              </div>
             )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {topInquiry
              ? `Pagsusuri: Sa napiling timeframe, ang inquiry category na "${topInquiry.question}" ang pinakamadalas na lumitaw.`
              : 'Magpapakita lang ang insight na ito kapag may sapat nang live inquiries sa napiling timeframe.'}
          </p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Pinakakaraniwang Uri ng Inquiry ({activeLabel})</DialogTitle>
            <DialogDescription>
              Kinakategorya ng ulat na ito ang mga pinakamadalas na inquiry types batay sa parsed intent at live message content. Mahalaga ito para sa knowledge-base planning at extension prioritization.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            {hasInquiryData ? (
              <>
                <div className="h-[400px] w-full mt-4">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                        {renderChart()}
                    </ChartContainer>
                </div>
                <div className="mt-8 text-sm text-muted-foreground space-y-2">
                    <p><strong>Detalyadong Pagsusuri:</strong> Ang chart sa itaas ay batay sa mga aktuwal na inquiry categories na lumitaw sa live dataset para sa napiling timeframe.</p>
                    <p><strong>Rekomendasyon:</strong> I-prioritize ang knowledge-base articles at reply templates para sa mga tanong na paulit-ulit na lumilitaw sa listahang ito.</p>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                Wala pang sapat na live inquiry data para sa expanded report na ito.
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


