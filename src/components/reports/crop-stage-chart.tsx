"use client"

import { useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { cropStageData } from "@/lib/data"
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
    Pagtatanim: { label: "Pagtatanim", color: "hsl(var(--chart-1))" },
    Paglago: { label: "Paglago", color: "hsl(var(--chart-2))" },
    Pamumulaklak: { label: "Pamumulaklak", color: "hsl(var(--chart-3))" },
    "Pag-aani": { label: "Pag-aani", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

export function CropStageChart() {
  const [timeframe, setTimeframe] = useState('Kasalukuyan');

  const plantingStage = cropStageData.find(d => d.name === 'Pagtatanim')?.value ?? 0;
  const growingStage = cropStageData.find(d => d.name === 'Paglago')?.value ?? 0;

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
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{timeframe}</span>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setTimeframe('Kasalukuyan')}>Kasalukuyan</DropdownMenuItem>
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
                <CardTitle>Pamamahagi ng Yugto ng Pananim</CardTitle>
                <CardDescription>Porsyento ng mga pananim sa bawat yugto.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
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
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Karamihan sa mga bukid ay nasa yugto ng "Pagtatanim" at "Paglago", na nagpapahiwatig ng peak season.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Pamamahagi ng Yugto ng Pananim ({timeframe})</DialogTitle>
            <DialogDescription>
              Nagbibigay ang ulat na ito ng pangkalahatang-ideya ng kasalukuyang estado ng agrikultura sa barangay. Ang pag-alam kung anong yugto ang karamihan sa mga magsasaka ay nakakatulong sa pag-prioritize ng mga mapagkukunan at payo.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Sa kasalukuyan, {plantingStage} na bukid ang nasa yugto ng pagtatanim at {growingStage} ang nasa paglago. Ipinapahiwatig nito na ang pangangailangan para sa mga binhi, pataba, at payo sa maagang yugto ng paglago ay mataas. Ang mas maliit na bilang sa "Pamumulaklak" at "Pag-aani" ay nagmumungkahi na ang panahon ng pag-aani ay malapit nang matapos para sa ilang pananim.</p>
                <p><strong>Rekomendasyon:</strong> Tiyaking may sapat na imbentaryo ng mga binhi at pataba. I-prioritize ang pag-broadcast ng mga advisory na may kaugnayan sa paghahanda ng lupa at maagang pamamahala ng peste. Magplano ng mga seminar o field visit na nakatuon sa mga magsasakang nagsisimula pa lang sa kanilang crop cycle.</p>
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
