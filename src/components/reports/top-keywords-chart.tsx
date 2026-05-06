"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/use-analytics"
import { useReportsTimeframe } from "@/context/reports-timeframe-context"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
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
import { openPrintableReport, sanitizePrintableRows } from "@/lib/report-export";


const chartConfig = {
  count: {
    label: "Bilang",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function TopKeywordsChart() {
  const { topKeywordsData } = useAnalytics();
  const { timeframe, setTimeframe } = useReportsTimeframe();
  const handleDownload = () => {
    void openPrintableReport({
      title: "Mga Karaniwang Salita",
      timeframe,
      description: "Mga keyword na pinakamadalas lumabas sa live SMS messages.",
      rows: sanitizePrintableRows(topKeywordsData),
    });
  };
  const hasKeywordData = topKeywordsData.some((item) => item.count > 0);
  const topKeyword = hasKeywordData
    ? topKeywordsData.reduce((prev, current) => (prev.count > current.count) ? prev : current)
    : null;

  const renderChart = () => (
     <ResponsiveContainer width="100%" height="100%">
        <BarChart data={topKeywordsData} layout="vertical" margin={{ left: 10, right: 20 }}>
             <XAxis type="number" hide />
             <YAxis 
                dataKey="word" 
                type="category" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                width={80}
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
                <CardTitle>Mga Karaniwang Salita</CardTitle>
                <CardDescription>Mga pinakamadalas na salitang ginagamit sa SMS.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            {topKeyword ? (
              <div className="flex flex-col items-center gap-2">
                  <p className="text-5xl font-bold text-chart-1">{topKeyword.count}</p>
                  <p className="text-sm text-muted-foreground">pagbanggit ng '{topKeyword.word}'</p>
              </div>
            ) : (
              <div className="px-6 text-center text-sm text-muted-foreground">
                Wala pang sapat na live SMS text para makabuo ng top keywords.
              </div>
            )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {topKeyword
              ? `Pagsusuri: Sa kasalukuyang live data, nangunguna ang "${topKeyword.word}" bilang pinakamadalas na keyword.`
              : 'Magpapakita lang ang insight na ito kapag may sapat nang live SMS messages sa napiling timeframe.'}
          </p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Mga Karaniwang Salita ({timeframe})</DialogTitle>
            <DialogDescription>
              Tinutukoy ng ulat na ito ang mga pinakamadalas na salitang ginagamit ng mga magsasaka sa kanilang mga mensahe. Ito ay isang direktang bintana sa kanilang mga alalahanin at prayoridad.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            {hasKeywordData ? (
              <>
                <div className="h-[400px] w-full mt-4">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                        {renderChart()}
                    </ChartContainer>
                </div>
                <div className="mt-8 text-sm text-muted-foreground space-y-2">
                    <p><strong>Detalyadong Pagsusuri:</strong> Batay sa live na mensahe, ang mga keyword na nasa itaas ang pinakamadalas lumabas sa napiling timeframe. Makakatulong ito para tukuyin kung anong mga alalahanin ang paulit-ulit na lumilitaw sa barangay feed.</p>
                    <p><strong>Rekomendasyon:</strong> Gamitin ang mga keyword na ito para i-tag ang knowledge-base content at i-compare sa mga susunod na reporting period kung may bagong concern na umuusbong.</p>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                Wala pang sapat na live SMS text para makabuo ng keyword distribution sa napiling timeframe.
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





