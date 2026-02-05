"use client"

import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { aiConfidenceTrendData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Expand, TrendingUp } from "lucide-react";
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


const chartConfig = {
  confidence: {
    label: "Kumpiyansa (%)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function AIConfidenceTrendChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');
  
  const latestConfidence = aiConfidenceTrendData[aiConfidenceTrendData.length - 1].confidence;

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={aiConfidenceTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis unit="%" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <Tooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="confidence" stroke="var(--color-confidence)" strokeWidth={2} dot={true} />
        </LineChart>
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
             </div>
            <div className="grid gap-0.5">
                <CardTitle>Trend ng Kumpiyansa ng AI</CardTitle>
                <CardDescription>Pag-unlad ng kumpiyansa ng AI sa paglipas ng panahon.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex items-center gap-2 text-chart-1">
                <TrendingUp className="h-16 w-16" />
                <div>
                    <p className="text-5xl font-bold">{latestConfidence}%</p>
                    <p className="text-sm text-muted-foreground">Kasalukuyang Kumpiyansa</p>
                </div>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Tumaas ang kumpiyansa ng AI, na nagpapakita ng pag-aaral at pag-unlad nito.</p>
        </CardFooter>
      </Card>
       <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Trend ng Kumpiyansa ng AI ({timeframe})</DialogTitle>
            <DialogDescription>
                Sinusubaybayan ng chart na ito ang average na confidence score ng AI sa pag-interpret ng mga SMS sa paglipas ng panahon. Ang isang pataas na trend ay nagpapahiwatig na ang AI ay natututo at gumagaling mula sa mga feedback at pagwawasto.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig}>
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Makikita ang isang malinaw na pataas na trend sa kumpiyansa ng AI, na tumaas mula {aiConfidenceTrendData[0].confidence}% hanggang {latestConfidence}% sa loob ng apat na linggo. Ito ay isang malakas na indikasyon na ang "human-in-the-loop" na sistema ng feedback ay epektibo. Ang bawat pagwawasto na ginawa ng isang AEW ay nagsisilbing aral para sa AI.</p>
                <p><strong>Rekomendasyon:</strong> Ipagpatuloy ang regular na pagbibigay ng feedback at pagwawasto sa mga mungkahi ng AI. Bigyang-pansin ang mga mensahe kung saan biglang bumababa ang kumpiyansa; maaaring ito ay nagpapahiwatig ng isang bagong uri ng tanong o isang kumplikadong isyu na kailangang pag-aralan.</p>
            </div>
        </div>
        <DialogFooter className="pt-4">
            <DialogClose asChild>
                <Button type="button" variant="secondary">Isara</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
