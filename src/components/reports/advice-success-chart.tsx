"use client"

import { useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { adviceSuccessData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Expand } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"


const chartConfig = {
    Inaprubahan: { label: "Inaprubahan", color: "hsl(var(--chart-1))" },
    "In-edit": { label: "In-edit", color: "hsl(var(--chart-2))" },
    Tinanggihan: { label: "Tinanggihan", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function AdviceSuccessChart() {
  const [timeframe, setTimeframe] = useState('Lingguhan');

  const total = adviceSuccessData.reduce((acc, curr) => acc + curr.value, 0);
  const approvedPercentage = ((adviceSuccessData.find(d => d.status === 'Inaprubahan')?.value ?? 0) / total * 100).toFixed(0);

  const renderChart = () => (
     <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="status" />} />
            <Legend content={<ChartLegendContent nameKey="status"/>} />
            <Pie data={adviceSuccessData} dataKey="value" nameKey="status" innerRadius="50%" outerRadius="80%">
                 {adviceSuccessData.map((entry, index) => (
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
                  <CardTitle>Mga Rate ng Pagpapatunay ng Payo</CardTitle>
                  <CardDescription>Mga aksyon ng admin sa payo ng AI.</CardDescription>
              </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-1">{approvedPercentage}%</p>
                <p className="text-sm text-muted-foreground">ang Inaprubahan</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Mataas na pagiging maaasahan ng AI, na may {approvedPercentage}% ng payo na inaprubahan nang walang pag-edit.</p>
        </CardFooter>
      </Card>
      <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Mga Rate ng Pagpapatunay ng Payo ({timeframe})</DialogTitle>
                <DialogDescription>
                    Isang detalyadong pagtingin sa kung paano pinangangasiwaan ng mga admin ang mga mungkahi ng AI. Ang mataas na rate ng pag-apruba ay nagpapahiwatig ng malakas na pagganap at pagkakahanay ng AI sa kaalaman ng eksperto.
                </DialogDescription>
            </DialogHeader>
            <div className="h-[400px] w-full">
                <ChartContainer config={chartConfig}>
                    {renderChart()}
                </ChartContainer>
            </div>
            <DialogFooter className="mt-4 text-sm text-muted-foreground">
                <div className="flex flex-col gap-2">
                    <p><strong>Detalyadong Pagsusuri:</strong> Ang kasalukuyang rate ng pag-apruba na {approvedPercentage}% ay nagpapakita na ang AI ay karaniwang nagbibigay ng tumpak at naaangkop na payo. Ang {adviceSuccessData.find(d => d.status === 'In-edit')?.value}% ng mga pag-edit ay nagmumungkahi na may mga pagkakataon pa para sa AI na matuto ng mas tiyak na mga lokal na konteksto. Ang {adviceSuccessData.find(d => d.status === 'Tinanggihan')?.value}% na rejection rate ay mababa, na nagpapahiwatig na bihirang magbigay ng maling payo ang AI.</p>
                    <p><strong>Rekomendasyon:</strong> Suriin ang mga "In-edit" na kaso. Tukuyin ang mga karaniwang tema sa mga pagwawasto (hal., mga lokal na pangalan ng peste, partikular na dosis ng pataba) at gamitin ang mga ito bilang data para sa susunod na pagsasanay sa AI upang mapabuti pa ang katumpakan nito.</p>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}
