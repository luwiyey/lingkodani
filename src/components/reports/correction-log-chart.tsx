"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { correctionLogData } from "@/lib/data"
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


const chartConfig = {
  count: {
    label: "Bilang ng Corrections",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function CorrectionLogChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');
  const { toast } = useToast();

  const totalCorrections = correctionLogData.reduce((acc, curr) => acc + curr.count, 0);

  const handleDownload = () => {
    toast({
        title: "Nagsisimula ang Pag-download...",
        description: "Ang iyong chart ay ini-export bilang PDF.",
    });
  };
  
  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={correctionLogData} accessibilityLayer>
        <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
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
                <CardTitle>Log ng Mga Pagtutuwid</CardTitle>
                <CardDescription>Mga mensahe na manu-manong iwinasto ng mga eksperto.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-2">{totalCorrections}</p>
                <p className="text-sm text-muted-foreground">Kabuuang Pagtutuwid</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Ang pinakamadalas itama ay ang 'Entity', na nagpapahiwatig ng mga hamon sa pagkilala ng AI sa mga partikular na pangngalan.</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Log ng Mga Pagtutuwid ({timeframe})</DialogTitle>
            <DialogDescription>
                Sinusuri ng ulat na ito ang mga uri ng pagwawasto na ginawa ng mga AEW sa interpretasyon ng AI. Ang pag-unawa kung aling mga kategorya ang madalas na nangangailangan ng pag-edit ay mahalaga para sa naka-target na pagpapabuti ng modelo.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang "Entity" (pagkilala sa mga partikular na pangngalan tulad ng pangalan ng peste, gamot, o lugar) ang may pinakamaraming pagwawasto. Ito ay karaniwan sa mga AI model na nahihirapang unawain ang mga lokal at tiyak na termino. Ang "Intent" (ang layunin ng mensahe) ay mas madalang na i-correct, na nagpapakita na ang AI ay karaniwang nakukuha ang pangkalahatang layunin ng magsasaka.</p>
                <p><strong>Rekomendasyon:</strong> Mag-focus sa pagpapabuti ng 'Entity Recognition'. Magtipon ng listahan ng mga lokal na termino para sa mga pananim, peste, at pataba at idagdag ang mga ito sa dataset ng pagsasanay ng AI. Ang bawat pagwawasto sa 'Entity' ay isang mahalagang data point.</p>
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
