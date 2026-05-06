"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import { useToast } from "@/hooks/use-toast";
import { openPrintableReport, sanitizePrintableRows } from "@/lib/report-export";


const chartConfig = {
  visits: {
    label: "Interventions",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function InterventionSupportChart() {
  const { interventionSupportData } = useAnalytics();
  const { timeframe, setTimeframe } = useReportsTimeframe();
  const { toast } = useToast();

  const totalVisits = interventionSupportData.reduce((acc, item) => acc + item.visits, 0);
  
    const handleDownload = () => {
    const result = openPrintableReport({
      title: "Intervention Support",
      timeframe,
      description: "Bilang ng intervention at support actions na naitala.",
      rows: sanitizePrintableRows(interventionSupportData),
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
      <BarChart data={interventionSupportData} accessibilityLayer>
        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
          <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="visits" fill="var(--color-visits)" radius={4} />
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
                <CardTitle>Intervention Support</CardTitle>
                <CardDescription>Pinagsamang field visits at assistance actions ng barangay.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-1">{totalVisits}</p>
                <p className="text-sm text-muted-foreground">Kabuuang Intervention</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Pinagsasama nito ang onsite visits at assistance work para makita ang totoong field workload ng barangay team.</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Intervention Support ({timeframe})</DialogTitle>
            <DialogDescription>
              Ipinapakita ng ulat na ito ang pinagsamang bilang ng field visits at assistance actions na minarkahan bilang nangangailangan ng direktang interbensyon mula sa barangay team.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang bilang ng intervention support ay nagbibigay ng mas kumpletong sukatan para sa workload ng barangay team dahil kasama rito ang onsite visits at assistance follow-through. Mas malinaw nitong naipapakita kung aktuwal bang may kasunod na aksyon matapos ang isang ulat.</p>
                <p><strong>Rekomendasyon:</strong> Gamitin ang data na ito para sa pagpaplano ng workforce at resource allocation. Kapag mataas ang bilang ng interventions, tiyaking may sapat na AEW time, transport support, at inventory para sa field response.</p>
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


