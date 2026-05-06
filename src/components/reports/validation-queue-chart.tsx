"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { useReportsTimeframe } from "@/context/reports-timeframe-context"
import { ChartConfig, ChartContainer } from "../ui/chart"
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
  value: {
    label: "Mensahe",
  },
} satisfies ChartConfig

export function ValidationQueueChart() {
  const { validationQueueData } = useAnalytics();
  const { timeframe, setTimeframe } = useReportsTimeframe();
  const handleDownload = () => {
    void openPrintableReport({
      title: "Validation Queue",
      timeframe,
      description: "Bilang ng kasong naka-pending sa validation workflow.",
      rows: sanitizePrintableRows(validationQueueData),
    });
  };
  
  const pendingCount = validationQueueData.find(d => d.name === 'Nakabinbin')?.value ?? 0;

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
          data={validationQueueData}
          layout="vertical"
          margin={{ left: 10, right: 10 }}
      >
          <YAxis dataKey="name" type="category" ticks={[]} tickLine={false} axisLine={false} />
          <XAxis dataKey="value" type="number" hide />
          <Bar dataKey="value" layout="vertical" stackId="a" radius={5}>
                {validationQueueData.map((item) => (
                  <Cell key={item.name} fill={item.fill} />
              ))}
          </Bar>
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
                <CardTitle>Validation Queue</CardTitle>
                <CardDescription>Bilang ng mga mensaheng nakabinbin vs. nalutas.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-2">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Hindi pa saradong SMS cases</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: May {pendingCount} na SMS cases na hindi pa sarado sa napiling timeframe.</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Katayuan ng Validation Queue ({timeframe})</DialogTitle>
            <DialogDescription>
              Ipinapakita ng ulat na ito ang bilang ng mga SMS cases na hindi pa sarado kumpara sa mga naisara na sa napiling timeframe.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang chart na ito ay nakabatay sa aktuwal na case closure state, hindi lang sa approval status. Kaya ang "Nakabinbin" ay tumutukoy sa mga kasong hindi pa sarado at maaari pang kailanganin ng assignment, clarification, o follow-through.</p>
                <p><strong>Rekomendasyon:</strong> Subaybayan ang bilang ng mga nakabinbin. Kung ito ay patuloy na tumataas, maaaring ito ay isang senyales na kulang ang mga tauhan upang mapangasiwaan ang dami ng mga mensahe. Gamitin ang data na ito upang matukoy ang mga oras na may pinakamataas na pila at mag-iskedyul ng mga tauhan nang naaayon.</p>
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


