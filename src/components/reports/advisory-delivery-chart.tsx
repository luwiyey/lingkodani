"use client"

import { useState } from "react";
import { Pie, PieChart, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { advisoryDeliveryData } from "@/lib/data"
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
  DialogClose,
} from "@/components/ui/dialog"

const chartConfig = {
  Tagumpay: { label: "Tagumpay", color: "hsl(var(--chart-1))" },
  Nabigo: { label: "Nabigo", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function AdvisoryDeliveryChart() {
  const [timeframe, setTimeframe] = useState('Lingguhan');
  
  const successEntry = advisoryDeliveryData.find(d => d.name === 'Tagumpay');
  const successPercentage = successEntry ? successEntry.value : 0;

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip content={<ChartTooltipContent nameKey="name" />} />
        <Legend content={<ChartLegendContent nameKey="name" />} />
        <Pie data={advisoryDeliveryData} dataKey="value" nameKey="name" innerRadius="60%">
          {advisoryDeliveryData.map((entry) => (
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
                <CardTitle>Success Rate ng Pagpapadala ng Advisory</CardTitle>
                <CardDescription>Porsyento ng mga SMS na matagumpay na naipadala.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-1">{successPercentage}%</p>
                <p className="text-sm text-muted-foreground">ang Naipadala</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Ang {successPercentage}% delivery rate ay nagpapakita ng maaasahang channel ng komunikasyon.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Success Rate ng Pagpapadala ng Advisory ({timeframe})</DialogTitle>
            <DialogDescription>
                Sinusukat ng chart na ito ang pagiging maaasahan ng SMS gateway sa paghahatid ng mga mensahe sa mga magsasaka. Ang mataas na rate ay mahalaga para sa epektibong komunikasyon.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig}>
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Isang delivery rate na {successPercentage}% ay napakahusay at nagpapahiwatig na halos lahat ng mga payo ay nakakarating sa mga magsasaka. Ang maliit na porsyento ng mga pagkabigo ay maaaring sanhi ng mga isyu sa network, hindi aktibong numero, o puno na inbox.</p>
                <p><strong>Rekomendasyon:</strong> Imbestigahan ang mga nabigong paghahatid. Kung ang isang numero ay palaging nabibigo, i-flag ito para sa manu-manong pag-verify. Maaari mong ipaalam sa AEW na kumpirmahin ang numero ng telepono sa susunod na pagbisita sa bukid.</p>
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
