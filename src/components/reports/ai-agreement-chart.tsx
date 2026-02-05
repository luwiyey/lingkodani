"use client"

import { useState } from "react";
import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { aiAgreementData } from "@/lib/data"
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
  "Approved As-is": { label: "Inaprubahan (Walang Edit)", color: "hsl(var(--chart-1))" },
  Revised: { label: "Binago", color: "hsl(var(--chart-2))" },
  Rejected: { label: "Tinanggihan", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function AIAgreementChart() {
  const [timeframe, setTimeframe] = useState('Lingguhan');

  const total = aiAgreementData.reduce((acc, curr) => acc + curr.value, 0);
  const approvedAsIsPercentage = ((aiAgreementData.find(d => d.name === 'Approved As-is')?.value ?? 0) / total * 100).toFixed(0);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip content={<ChartTooltipContent nameKey="name" />} />
        <Legend content={<ChartLegendContent nameKey="name" />} />
        <Pie data={aiAgreementData} dataKey="value" nameKey="name" innerRadius="60%">
          {aiAgreementData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
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
                  <CardTitle>Pagkakatugma ng AI at Expert</CardTitle>
                  <CardDescription>Porsyento ng mga payo ng AI na inaprubahan nang walang pag-edit.</CardDescription>
              </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-1">{approvedAsIsPercentage}%</p>
                <p className="text-sm text-muted-foreground">Pagsang-ayon</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: {approvedAsIsPercentage}% ng mga output ng AI ay inaprubahan nang walang pag-edit, na nagpapakita ng malakas na pagkakasundo.</p>
        </CardFooter>
      </Card>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
            <DialogTitle>Pagkakatugma ng AI at Expert ({timeframe})</DialogTitle>
            <DialogDescription>
              Sinusukat nito kung gaano kadalas sumasang-ayon ang mga Agricultural Extension Worker (AEW) sa mga payo ng AI. Ito ay isang mahalagang sukatan para sa pagtitiwala at pagiging epektibo ng sistema.
            </DialogDescription>
        </DialogHeader>
        <div className="h-[400px] w-full">
            <ChartContainer config={chartConfig}>
                {renderChart()}
            </ChartContainer>
        </div>
        <DialogFooter className="mt-4 text-sm text-muted-foreground">
            <div className="flex flex-col gap-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang {approvedAsIsPercentage}% na rate ng pagsang-ayon ay nagpapahiwatig na ang AI model ay mahusay na naka-align sa kaalaman ng mga lokal na eksperto. Ibig sabihin, sa karamihan ng mga kaso, ang paunang payo ng AI ay tama na at hindi na kailangan ng pagbabago. Ito ay nakakatipid ng oras para sa mga AEW.</p>
                <p><strong>Rekomendasyon:</strong> Upang mapabuti pa ito, regular na suriin ang mga "Binago" at "Tinanggihan" na mga payo. Gamitin ang mga ito bilang data para sa fine-tuning ng AI model upang mas maunawaan nito ang mga partikular na sitwasyon sa barangay.</p>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
