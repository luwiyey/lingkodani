"use client"

import { Pie, PieChart, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { useReportsTimeframe } from "@/context/reports-timeframe-context"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltipContent } from "../ui/chart"
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


const chartConfig = {
  Neutral: { label: "Neutral", color: "hsl(var(--chart-1))" },
  'Nag-aalala': { label: "Nag-aalala", color: "hsl(var(--chart-2))" },
  Kritikal: { label: "Kritikal", color: "hsl(var(--destructive))" },
  Positibo: { label: "Positibo", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export function MessageToneChart() {
  const { messageToneData } = useAnalytics();
  const { timeframe, setTimeframe } = useReportsTimeframe();
  
  const concernedTone = messageToneData.find(d => d.tone === 'Nag-aalala')?.count ?? 0;
  const criticalTone = messageToneData.find(d => d.tone === 'Kritikal')?.count ?? 0;
  const totalUrgent = concernedTone + criticalTone;

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <RechartsTooltip content={<ChartTooltipContent nameKey="tone" />} />
        <Legend content={<ChartLegendContent nameKey="tone" />} />
        <Pie data={messageToneData} dataKey="count" nameKey="tone" innerRadius="60%">
          {messageToneData.map((entry) => (
            <Cell key={entry.tone} fill={entry.fill} />
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
                    <Button variant="outline" size="icon" className="h-8 w-8">
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
                <CardTitle>Tono ng Mensahe</CardTitle>
                <CardDescription>Pamamahagi ng emosyonal na tono sa mga mensahe.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-destructive">{totalUrgent}</p>
                <p className="text-sm text-muted-foreground">Nag-aalala at Kritikal na mensahe</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Karamihan ay "Neutral," ngunit ang {totalUrgent} na mensaheng nag-aalala ay nangangailangan ng pansin.</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Tono ng Mensahe ({timeframe})</DialogTitle>
            <DialogDescription>
              Awtomatikong sinusuri ng AI ang emosyonal na tono ng bawat mensahe. Ang pag-unawa sa tono (hal., neutral, nag-aalala, kritikal) ay tumutulong sa mga admin na i-prioritize ang mga pinaka-urgent na kaso.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Habang ang karamihan ng mga mensahe ay "Neutral" (impormatibo), mayroong isang malaking bilang ng mga "Nag-aalala" at "Kritikal" na mga mensahe. Ito ang mga ulat kung saan ang mga magsasaka ay nagpapahayag ng pagkabahala o takot tungkol sa kanilang mga pananim, na nangangailangan ng mas mabilis at mas sensitibong pagtugon.</p>
                <p><strong>Rekomendasyon:</strong> Gamitin ang pagsusuri ng tono bilang isang filter sa SMS Feed upang unahin ang mga "Kritikal" at "Nag-aalala" na mga mensahe. Tiyaking ang mga template ng tugon para sa mga ganitong kaso ay nagpapakita ng empatiya at pag-unawa, bilang karagdagan sa pagbibigay ng teknikal na payo.</p>
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




